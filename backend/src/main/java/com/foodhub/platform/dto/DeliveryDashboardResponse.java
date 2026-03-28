package com.foodhub.platform.dto;

import java.util.List;

public record DeliveryDashboardResponse(
        String driverName,
        String driverEmail,
        Double currentLatitude,
        Double currentLongitude,
        DeliveryEarningsSummaryResponse earnings,
        List<DeliveryCommissionResponse> commissions,
        List<OrderResponse> availableOrders,
        List<OrderResponse> assignedOrders
) {
}
