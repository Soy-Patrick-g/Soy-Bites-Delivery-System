package com.foodhub.platform.dto;

import java.math.BigDecimal;
import java.util.List;

public record WithdrawalDashboardResponse(
        String fullName,
        String email,
        BigDecimal walletBalance,
        BigDecimal reservedBalance,
        BigDecimal availableBalance,
        BigDecimal withdrawnTotal,
        List<WithdrawalResponse> withdrawals
) {
}
