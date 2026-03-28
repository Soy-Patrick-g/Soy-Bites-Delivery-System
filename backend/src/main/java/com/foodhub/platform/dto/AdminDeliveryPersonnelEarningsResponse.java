package com.foodhub.platform.dto;

import java.math.BigDecimal;

public record AdminDeliveryPersonnelEarningsResponse(
        Long deliveryPersonId,
        String deliveryPersonName,
        String deliveryPersonEmail,
        BigDecimal totalEarnings,
        BigDecimal pendingEarnings,
        BigDecimal paidEarnings,
        long completedDeliveries
) {
}
