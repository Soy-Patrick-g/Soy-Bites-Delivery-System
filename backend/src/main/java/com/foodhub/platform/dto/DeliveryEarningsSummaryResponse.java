package com.foodhub.platform.dto;

import java.math.BigDecimal;

public record DeliveryEarningsSummaryResponse(
        BigDecimal totalEarnings,
        BigDecimal pendingEarnings,
        BigDecimal paidEarnings,
        long completedDeliveries
) {
}
