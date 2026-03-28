package com.foodhub.platform.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminDeliveryCommissionResponse(
        Long id,
        Long deliveryPersonId,
        String deliveryPersonName,
        String deliveryPersonEmail,
        Long orderId,
        String groupReference,
        BigDecimal deliveryFee,
        BigDecimal commissionAmount,
        String paymentStatus,
        Instant createdAt,
        Instant paidAt
) {
}
