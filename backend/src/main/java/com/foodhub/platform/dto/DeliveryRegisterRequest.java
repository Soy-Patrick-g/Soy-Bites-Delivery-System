package com.foodhub.platform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DeliveryRegisterRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @NotBlank String password,
        @NotBlank String city,
        @NotBlank String vehicleType,
        @NotNull Double latitude,
        @NotNull Double longitude
) {
}
