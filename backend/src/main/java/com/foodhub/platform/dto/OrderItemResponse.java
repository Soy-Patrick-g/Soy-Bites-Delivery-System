package com.foodhub.platform.dto;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long menuItemId,
        String name,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {
}

