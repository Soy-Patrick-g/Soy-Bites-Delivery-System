package com.foodhub.platform.dto;

import com.foodhub.platform.model.UserRole;

public record AuthResponse(
        String token,
        String fullName,
        String email,
        UserRole role
) {
}

