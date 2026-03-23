package com.foodhub.platform.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminTransactionResponse(
        Long id,
        Long orderId,
        String reference,
        String userEmail,
        String userName,
        BigDecimal amount,
        String status,
        Instant createdAt,
        String method,
        BigDecimal refundedAmount,
        BigDecimal chargebackAmount,
        boolean highValue
) {
}
