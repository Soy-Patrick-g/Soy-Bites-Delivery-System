package com.foodhub.platform.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateAccountProfileRequest(
        @NotBlank String fullName,
        String profileImageUrl
) {
}
