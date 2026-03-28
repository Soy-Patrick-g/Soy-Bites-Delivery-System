package com.foodhub.platform.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record DeliveryCommissionResponse(
        Long id,
        Long orderId,
        BigDecimal deliveryFee,
        BigDecimal commissionAmount,
        String paymentStatus,
        Instant createdAt,
        Instant paidAt
) {
}
