package com.foodhub.platform.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateRestaurantStatusRequest(
        @NotNull Boolean active
) {
}
