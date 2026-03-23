package com.foodhub.platform.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateMenuItemRequest(
        @NotBlank String name,
        @NotBlank String description,
        @NotNull @DecimalMin("0.01") BigDecimal price,
        String imageUrl,
        boolean vegetarian,
        boolean spicy,
        boolean available,
        boolean availableInAllBranches
) {
}
