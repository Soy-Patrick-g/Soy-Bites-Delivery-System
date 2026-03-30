package com.foodhub.platform.dto;

import com.foodhub.platform.model.UserRole;

public record AccountProfileResponse(
        String fullName,
        String email,
        UserRole role,
        String profileImageUrl
) {
}
