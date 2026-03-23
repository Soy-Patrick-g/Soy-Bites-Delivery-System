package com.foodhub.platform.dto;

import java.math.BigDecimal;
import java.util.List;

public record RestaurantSummaryResponse(
        Long id,
        String name,
        String brandName,
        String description,
        String cuisine,
        String city,
        String address,
        Double latitude,
        Double longitude,
        BigDecimal averageRating,
        Double distanceKm,
        BigDecimal estimatedDeliveryFee,
        List<RestaurantPreviewItemResponse> featuredItems
) {
}
