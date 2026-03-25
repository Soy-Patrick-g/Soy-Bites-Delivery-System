package com.foodhub.platform.dto;

import java.time.Instant;

public record AdminRestaurantResponse(
        Long id,
        String name,
        String brandName,
        String ownerName,
        String ownerEmail,
        String city,
        String address,
        boolean active,
        boolean verified,
        Instant createdAt
) {
}
