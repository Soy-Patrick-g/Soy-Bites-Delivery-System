package com.foodhub.platform.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminUserInsightResponse(
        Long id,
        String fullName,
        String email,
        String role,
        boolean active,
        BigDecimal balance,
        String kycStatus,
        boolean riskFlagged,
        String alertNote,
        long transactionCount,
        List<AdminUserTransactionPreviewResponse> recentTransactions
) {
}
