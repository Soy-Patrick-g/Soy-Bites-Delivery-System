package com.foodhub.platform.service;

import com.foodhub.platform.dto.MenuItemResponse;
import com.foodhub.platform.dto.RestaurantPreviewItemResponse;
import com.foodhub.platform.dto.RestaurantDetailResponse;
import com.foodhub.platform.dto.RestaurantSummaryResponse;
import com.foodhub.platform.dto.ReviewRequest;
import com.foodhub.platform.dto.ReviewResponse;
import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.model.FoodOrder;
import com.foodhub.platform.model.MenuItem;
import com.foodhub.platform.model.OrderStatus;
import com.foodhub.platform.model.Restaurant;
import com.foodhub.platform.model.Review;
import com.foodhub.platform.repository.AppUserRepository;
import com.foodhub.platform.repository.MenuItemRepository;
import com.foodhub.platform.repository.OrderRepository;
import com.foodhub.platform.repository.RestaurantRepository;
import com.foodhub.platform.repository.ReviewRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final ReviewRepository reviewRepository;
    private final AppUserRepository appUserRepository;
    private final OrderRepository orderRepository;
    private final GeoService geoService;

    public RestaurantService(RestaurantRepository restaurantRepository,
                             MenuItemRepository menuItemRepository,
                             ReviewRepository reviewRepository,
                             AppUserRepository appUserRepository,
                             OrderRepository orderRepository,
                             GeoService geoService) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.reviewRepository = reviewRepository;
        this.appUserRepository = appUserRepository;
        this.orderRepository = orderRepository;
        this.geoService = geoService;
    }

    @Transactional(readOnly = true)
    public List<RestaurantSummaryResponse> getRestaurants(Double latitude, Double longitude, String city, String query) {
        List<Restaurant> restaurants = (city != null && !city.isBlank())
                ? restaurantRepository.findByActiveTrueAndCityIgnoreCase(city)
                : restaurantRepository.findByActiveTrue();

        return restaurants.stream()
                .filter(restaurant -> matchesQuery(restaurant, query))
                .map(restaurant -> toSummary(restaurant, latitude, longitude))
                .sorted(Comparator.comparing(
                        RestaurantSummaryResponse::distanceKm,
                        Comparator.nullsLast(Double::compareTo)
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public RestaurantDetailResponse getRestaurant(Long id, Double latitude, Double longitude) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restaurant not found"));

        List<MenuItemResponse> menu = menuItemRepository.findByRestaurantIdAndAvailableTrue(id)
                .stream()
                .map(this::toMenuItemResponse)
                .toList();

        List<ReviewResponse> reviews = reviewRepository.findByRestaurantIdOrderByCreatedAtDesc(id)
                .stream()
                .map(review -> new ReviewResponse(
                        review.getId(),
                        review.getCustomer().getFullName(),
                        review.getRating(),
                        review.getComment(),
                        review.getCreatedAt()
                ))
                .toList();

        RestaurantSummaryResponse summary = toSummary(restaurant, latitude, longitude);
        return new RestaurantDetailResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getDescription(),
                restaurant.getCuisine(),
                restaurant.getAddress(),
                restaurant.getCity(),
                restaurant.getLatitude(),
                restaurant.getLongitude(),
                restaurant.getAverageRating(),
                summary.distanceKm(),
                summary.estimatedDeliveryFee(),
                menu,
                reviews
        );
    }

    @Transactional
    public ReviewResponse addReview(String requesterEmail, ReviewRequest request) {
        AppUser customer = appUserRepository.findByEmailIgnoreCase(requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
        FoodOrder order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only review your own delivered orders");
        }
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can review a restaurant only after delivery");
        }
        if (reviewRepository.existsByOrderId(order.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This order has already been reviewed");
        }

        Restaurant restaurant = order.getRestaurant();

        Review review = new Review();
        review.setCustomer(customer);
        review.setRestaurant(restaurant);
        review.setOrder(order);
        review.setRating(request.rating());
        review.setComment(request.comment());
        Review saved = reviewRepository.save(review);

        recalculateAverageRating(restaurant);

        return new ReviewResponse(
                saved.getId(),
                customer.getFullName(),
                saved.getRating(),
                saved.getComment(),
                saved.getCreatedAt()
        );
    }

    private void recalculateAverageRating(Restaurant restaurant) {
        List<Review> reviews = reviewRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurant.getId());
        double average = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
        restaurant.setAverageRating(BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP));
        restaurantRepository.save(restaurant);
    }

    private RestaurantSummaryResponse toSummary(Restaurant restaurant, Double latitude, Double longitude) {
        Double distance = null;
        BigDecimal fee = null;
        if (latitude != null && longitude != null) {
            distance = geoService.distanceInKm(latitude, longitude, restaurant.getLatitude(), restaurant.getLongitude());
            fee = geoService.calculateDeliveryFee(distance);
        }
        return new RestaurantSummaryResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getDescription(),
                restaurant.getCuisine(),
                restaurant.getCity(),
                restaurant.getAddress(),
                restaurant.getAverageRating(),
                distance == null ? null : BigDecimal.valueOf(distance).setScale(2, RoundingMode.HALF_UP).doubleValue(),
                fee,
                menuItemRepository.findByRestaurantIdAndAvailableTrue(restaurant.getId()).stream()
                        .limit(3)
                        .map(item -> new RestaurantPreviewItemResponse(
                                item.getId(),
                                item.getName(),
                                item.getPrice(),
                                item.getImageUrl()
                        ))
                        .toList()
        );
    }

    private MenuItemResponse toMenuItemResponse(MenuItem item) {
        return new MenuItemResponse(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getPrice(),
                item.getImageUrl(),
                item.isVegetarian(),
                item.isSpicy()
        );
    }

    private boolean matchesQuery(Restaurant restaurant, String query) {
        if (query == null || query.isBlank()) {
            return true;
        }
        String normalized = query.toLowerCase(Locale.ROOT);
        return restaurant.getName().toLowerCase(Locale.ROOT).contains(normalized)
                || restaurant.getCuisine().toLowerCase(Locale.ROOT).contains(normalized)
                || restaurant.getDescription().toLowerCase(Locale.ROOT).contains(normalized);
    }
}
