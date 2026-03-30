package com.foodhub.platform.dto;

import com.foodhub.platform.model.UserRole;
import java.time.Instant;

public record AuthResponse(
        String token,
        String fullName,
        String email,
        UserRole role,
        String profileImageUrl,
        Instant expiresAt
) {
}
