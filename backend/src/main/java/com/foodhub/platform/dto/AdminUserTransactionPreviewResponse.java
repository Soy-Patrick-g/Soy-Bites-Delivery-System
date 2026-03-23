package com.foodhub.platform.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminUserTransactionPreviewResponse(
        Long transactionId,
        String reference,
        BigDecimal amount,
        String status,
        Instant createdAt
) {
}
