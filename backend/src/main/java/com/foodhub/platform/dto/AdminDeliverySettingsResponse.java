package com.foodhub.platform.dto;

import java.math.BigDecimal;

public record AdminDeliverySettingsResponse(
        BigDecimal deliveryBaseFee,
        BigDecimal deliveryFeePerKm,
        double freeDeliveryUnderKm,
        String commissionType,
        BigDecimal fixedCommissionAmount,
        BigDecimal commissionPercentage
) {
}
