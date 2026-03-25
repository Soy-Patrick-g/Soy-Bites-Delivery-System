package com.foodhub.platform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record RestaurantOwnerRegisterRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @NotBlank
        @Pattern(regexp = ValidationPatterns.STRONG_PASSWORD, message = ValidationPatterns.STRONG_PASSWORD_MESSAGE)
        String password,
        @NotBlank String restaurantName,
        @NotBlank String description,
        @NotBlank String cuisine,
        @NotBlank String address,
        @NotBlank String city,
        @NotNull Double latitude,
        @NotNull Double longitude
) {
}
