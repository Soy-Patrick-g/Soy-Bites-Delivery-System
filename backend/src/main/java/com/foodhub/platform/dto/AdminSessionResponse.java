package com.foodhub.platform.dto;

import java.time.Instant;

public record AdminSessionResponse(
        Long id,
        String userEmail,
        String userName,
        String userRole,
        String ipAddress,
        String userAgent,
        boolean active,
        Instant createdAt,
        Instant lastSeenAt,
        Instant expiresAt
) {
}
