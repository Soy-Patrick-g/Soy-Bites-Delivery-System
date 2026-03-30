package com.foodhub.platform.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record WithdrawalResponse(
        Long id,
        BigDecimal amount,
        String status,
        String provider,
        String reference,
        String paystackReference,
        String destinationType,
        String bankCode,
        String accountNumber,
        String accountName,
        String reason,
        String failureReason,
        Instant createdAt,
        Instant reviewedAt,
        Instant processedAt
) {
}
