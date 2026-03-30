package com.foodhub.platform.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ReviewRequest(
        @NotNull Long orderId,
        @NotNull
        @DecimalMin(value = "1.0")
        @DecimalMax(value = "5.0")
        @Digits(integer = 1, fraction = 1)
        BigDecimal rating,
        String comment
) {
}
