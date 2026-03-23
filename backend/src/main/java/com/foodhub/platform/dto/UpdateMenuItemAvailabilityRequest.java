package com.foodhub.platform.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateMenuItemAvailabilityRequest(
        @NotNull Boolean available
) {
}
