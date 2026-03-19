package com.foodhub.platform.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReviewRequest(
        @NotNull Long restaurantId,
        @NotBlank String customerEmail,
        @NotNull @Min(1) @Max(5) Integer rating,
        String comment
) {
}

