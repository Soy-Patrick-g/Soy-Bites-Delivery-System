package com.foodhub.platform.dto;

import java.math.BigDecimal;

public record RestaurantPreviewItemResponse(
        Long id,
        String name,
        BigDecimal price,
        String imageUrl
) {
}
