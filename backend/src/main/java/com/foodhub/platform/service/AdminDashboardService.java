package com.foodhub.platform.service;

import com.foodhub.platform.dto.AdminDashboardResponse;
import com.foodhub.platform.dto.RestaurantSummaryResponse;
import com.foodhub.platform.model.PaymentStatus;
import com.foodhub.platform.repository.OrderRepository;
import com.foodhub.platform.repository.RestaurantRepository;
import com.foodhub.platform.repository.ReviewRepository;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminDashboardService {

    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final RestaurantService restaurantService;

    public AdminDashboardService(RestaurantRepository restaurantRepository,
                                 OrderRepository orderRepository,
                                 ReviewRepository reviewRepository,
                                 RestaurantService restaurantService) {
        this.restaurantRepository = restaurantRepository;
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
        this.restaurantService = restaurantService;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        var restaurants = restaurantRepository.findByActiveTrue();
        BigDecimal totalRevenue = orderRepository.findAll().stream()
                .filter(order -> order.getPaymentStatus() == PaymentStatus.INITIALIZED || order.getPaymentStatus() == PaymentStatus.PAID)
                .map(order -> order.getTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalOwnerAllocations = orderRepository.findAll().stream()
                .filter(order -> order.getPaymentStatus() == PaymentStatus.PAID)
                .map(order -> order.getSubtotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<RestaurantSummaryResponse> topRestaurants = restaurants.stream()
                .map(restaurant -> restaurantService.getRestaurants(null, null, restaurant.getCity(), restaurant.getName()).stream()
                        .filter(summary -> summary.id().equals(restaurant.getId()))
                        .findFirst()
                        .orElse(null))
                .filter(summary -> summary != null)
                .sorted(Comparator.comparing(RestaurantSummaryResponse::averageRating).reversed())
                .limit(5)
                .toList();

        return new AdminDashboardResponse(
                restaurants.size(),
                orderRepository.count(),
                reviewRepository.count(),
                totalRevenue,
                totalOwnerAllocations,
                topRestaurants
        );
    }
}
