package com.foodhub.platform.service;

import com.foodhub.platform.dto.AuthResponse;
import com.foodhub.platform.dto.OrderItemResponse;
import com.foodhub.platform.dto.OrderResponse;
import com.foodhub.platform.dto.OwnerDashboardResponse;
import com.foodhub.platform.dto.PaymentInitializationResponse;
import com.foodhub.platform.dto.RestaurantPreviewItemResponse;
import com.foodhub.platform.dto.RestaurantOwnerRegisterRequest;
import com.foodhub.platform.dto.RestaurantSummaryResponse;
import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.model.FoodOrder;
import com.foodhub.platform.model.OrderItem;
import com.foodhub.platform.model.OrderStatus;
import com.foodhub.platform.model.PaymentStatus;
import com.foodhub.platform.model.Restaurant;
import com.foodhub.platform.model.UserRole;
import com.foodhub.platform.repository.AppUserRepository;
import com.foodhub.platform.repository.MenuItemRepository;
import com.foodhub.platform.repository.OrderRepository;
import com.foodhub.platform.repository.RestaurantRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OwnerPortalService {

    private final AppUserRepository appUserRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final PaymentService paymentService;
    private final GeoService geoService;

    public OwnerPortalService(AppUserRepository appUserRepository,
                              MenuItemRepository menuItemRepository,
                              RestaurantRepository restaurantRepository,
                              OrderRepository orderRepository,
                              PasswordEncoder passwordEncoder,
                              JwtService jwtService,
                              CustomUserDetailsService userDetailsService,
                              PaymentService paymentService,
                              GeoService geoService) {
        this.appUserRepository = appUserRepository;
        this.menuItemRepository = menuItemRepository;
        this.restaurantRepository = restaurantRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.paymentService = paymentService;
        this.geoService = geoService;
    }

    @Transactional
    public AuthResponse registerOwner(RestaurantOwnerRegisterRequest request) {
        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        AppUser owner = new AppUser();
        owner.setFullName(request.fullName());
        owner.setEmail(request.email());
        owner.setPassword(passwordEncoder.encode(request.password()));
        owner.setRole(UserRole.RESTAURANT);
        owner.setLatitude(request.latitude());
        owner.setLongitude(request.longitude());
        appUserRepository.save(owner);

        Restaurant restaurant = new Restaurant();
        restaurant.setName(request.restaurantName());
        restaurant.setDescription(request.description());
        restaurant.setCuisine(request.cuisine());
        restaurant.setAddress(request.address());
        restaurant.setCity(request.city());
        restaurant.setLatitude(request.latitude());
        restaurant.setLongitude(request.longitude());
        restaurant.setOwner(owner);
        restaurant.setActive(true);
        restaurantRepository.save(restaurant);

        String token = jwtService.generateToken(
                userDetailsService.loadUserByUsername(owner.getEmail()),
                owner.getRole().name()
        );
        return new AuthResponse(token, owner.getFullName(), owner.getEmail(), owner.getRole());
    }

    @Transactional(readOnly = true)
    public OwnerDashboardResponse getDashboard(String ownerEmail) {
        AppUser owner = appUserRepository.findByEmailIgnoreCase(ownerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));

        List<RestaurantSummaryResponse> restaurants = restaurantRepository.findByOwnerId(owner.getId()).stream()
                .map(this::toRestaurantSummary)
                .toList();

        List<OrderResponse> orders = orderRepository.findByRestaurantOwnerIdOrderByCreatedAtDesc(owner.getId()).stream()
                .map(this::toOrderResponse)
                .toList();

        var allocatedRevenue = orderRepository.findByRestaurantOwnerIdOrderByCreatedAtDesc(owner.getId()).stream()
                .filter(order -> order.getPaymentStatus() == PaymentStatus.PAID)
                .map(FoodOrder::getSubtotal)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        return new OwnerDashboardResponse(owner.getFullName(), owner.getEmail(), allocatedRevenue, restaurants, orders);
    }

    @Transactional
    public OrderResponse advanceOrder(String ownerEmail, Long orderId) {
        FoodOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getRestaurant().getOwner() == null
                || !order.getRestaurant().getOwner().getEmail().equalsIgnoreCase(ownerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own restaurant orders");
        }

        OrderStatus nextStatus = switch (order.getStatus()) {
            case RECEIVED -> OrderStatus.PREPARING;
            case PREPARING -> OrderStatus.OUT_FOR_DELIVERY;
            case OUT_FOR_DELIVERY -> OrderStatus.DELIVERED;
            case DELIVERED -> OrderStatus.DELIVERED;
        };
        order.setStatus(nextStatus);
        return toOrderResponse(orderRepository.save(order));
    }

    private RestaurantSummaryResponse toRestaurantSummary(Restaurant restaurant) {
        Double distanceKm = null;
        if (restaurant.getOwner() != null
                && restaurant.getOwner().getLatitude() != null
                && restaurant.getOwner().getLongitude() != null) {
            distanceKm = geoService.distanceInKm(
                    restaurant.getOwner().getLatitude(),
                    restaurant.getOwner().getLongitude(),
                    restaurant.getLatitude(),
                    restaurant.getLongitude()
            );
        }

        return new RestaurantSummaryResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getDescription(),
                restaurant.getCuisine(),
                restaurant.getCity(),
                restaurant.getAddress(),
                restaurant.getAverageRating(),
                distanceKm,
                distanceKm == null ? null : geoService.calculateDeliveryFee(distanceKm),
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

    private OrderResponse toOrderResponse(FoodOrder order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(this::toOrderItemResponse)
                .toList();

        PaymentInitializationResponse payment = paymentService.getPaymentDetails(order);
        return new OrderResponse(
                order.getId(),
                order.getGroupReference(),
                order.getRestaurant().getName(),
                order.getCustomer().getFullName(),
                order.getDeliveryPerson() == null ? null : order.getDeliveryPerson().getFullName(),
                order.getDeliveryPerson() == null ? null : order.getDeliveryPerson().getEmail(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getPaymentReference(),
                order.getDeliveryAddress(),
                order.getDistanceKm(),
                order.getSubtotal(),
                order.getDeliveryFee(),
                order.getSubtotal(),
                order.getTotal(),
                order.getCreatedAt(),
                items,
                payment
        );
    }

    private OrderItemResponse toOrderItemResponse(OrderItem item) {
        return new OrderItemResponse(
                item.getId(),
                item.getMenuItem().getId(),
                item.getMenuItem().getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getTotalPrice()
        );
    }
}
