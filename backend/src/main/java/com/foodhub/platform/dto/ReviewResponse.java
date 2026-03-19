package com.foodhub.platform.dto;

import java.time.Instant;

public record ReviewResponse(
        Long id,
        String customerName,
        Integer rating,
        String comment,
        Instant createdAt
) {
}

