package com.foodhub.platform.dto;

import java.math.BigDecimal;
import java.util.List;

public record RestaurantDetailResponse(
        Long id,
        String name,
        String description,
        String cuisine,
        String address,
        String city,
        Double latitude,
        Double longitude,
        BigDecimal averageRating,
        Double distanceKm,
        BigDecimal estimatedDeliveryFee,
        List<MenuItemResponse> menu,
        List<ReviewResponse> reviews
) {
}

