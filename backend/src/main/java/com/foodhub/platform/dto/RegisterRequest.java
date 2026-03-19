package com.foodhub.platform.dto;

import com.foodhub.platform.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegisterRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @NotBlank String password,
        @NotNull UserRole role,
        Double latitude,
        Double longitude
) {
}

