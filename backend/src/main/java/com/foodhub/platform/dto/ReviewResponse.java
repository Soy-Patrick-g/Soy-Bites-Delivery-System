package com.foodhub.platform.dto;

import java.time.Instant;
import java.math.BigDecimal;

public record ReviewResponse(
        Long id,
        String customerName,
        String customerProfileImageUrl,
        BigDecimal rating,
        String comment,
        Instant createdAt
) {
}
