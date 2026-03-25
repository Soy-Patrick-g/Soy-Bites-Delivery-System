package com.foodhub.platform.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateAccountStatusRequest(
        @NotNull Boolean active
) {
}
