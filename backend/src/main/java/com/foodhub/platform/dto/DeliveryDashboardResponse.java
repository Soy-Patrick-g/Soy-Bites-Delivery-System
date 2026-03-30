package com.foodhub.platform.dto;

import java.util.List;

public record DeliveryDashboardResponse(
        String driverName,
        String driverEmail,
        Double currentLatitude,
        Double currentLongitude,
        java.math.BigDecimal walletBalance,
        java.math.BigDecimal reservedBalance,
        java.math.BigDecimal availableBalance,
        java.math.BigDecimal withdrawnTotal,
        DeliveryEarningsSummaryResponse earnings,
        List<DeliveryCommissionResponse> commissions,
        List<OrderResponse> availableOrders,
        List<OrderResponse> assignedOrders
) {
}
