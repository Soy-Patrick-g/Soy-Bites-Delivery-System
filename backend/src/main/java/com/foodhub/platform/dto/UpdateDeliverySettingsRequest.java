package com.foodhub.platform.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateDeliverySettingsRequest(
        @NotNull @DecimalMin(value = "0.00") BigDecimal deliveryBaseFee,
        @NotNull @DecimalMin(value = "0.00") BigDecimal deliveryFeePerKm,
        @DecimalMin(value = "0.0") double freeDeliveryUnderKm,
        @NotBlank String commissionType,
        @NotNull @DecimalMin(value = "0.00") BigDecimal fixedCommissionAmount,
        @NotNull @DecimalMin(value = "0.00") BigDecimal commissionPercentage
) {
}
