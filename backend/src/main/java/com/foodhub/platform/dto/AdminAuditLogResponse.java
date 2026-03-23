package com.foodhub.platform.dto;

import java.time.Instant;

public record AdminAuditLogResponse(
        Long id,
        String actorEmail,
        String actorRole,
        String action,
        String targetType,
        String targetId,
        String details,
        String ipAddress,
        Instant createdAt
) {
}
