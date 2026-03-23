package com.foodhub.platform.dto;

import java.math.BigDecimal;

public record AdminTrendPointResponse(
        String label,
        long transactionCount,
        BigDecimal volume
) {
}
