package com.foodhub.platform.dto;

import java.math.BigDecimal;
import java.util.List;

public record OwnerDashboardResponse(
        String ownerName,
        String ownerEmail,
        BigDecimal allocatedRevenue,
        BigDecimal walletBalance,
        BigDecimal reservedBalance,
        BigDecimal availableBalance,
        BigDecimal withdrawnTotal,
        List<RestaurantSummaryResponse> restaurants,
        List<OrderResponse> orders
) {
}
