package com.foodhub.platform.dto;

import java.math.BigDecimal;

public record RestaurantSummaryResponse(
        Long id,
        String name,
        String description,
        String cuisine,
        String city,
        String address,
        BigDecimal averageRating,
        Double distanceKm,
        BigDecimal estimatedDeliveryFee
) {
}

