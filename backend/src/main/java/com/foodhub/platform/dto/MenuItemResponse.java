package com.foodhub.platform.dto;

import java.math.BigDecimal;

public record MenuItemResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        String imageUrl,
        boolean vegetarian,
        boolean spicy
) {
}

