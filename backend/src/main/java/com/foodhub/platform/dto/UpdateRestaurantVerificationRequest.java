package com.foodhub.platform.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateRestaurantVerificationRequest(
        @NotNull Boolean verified
) {
}
