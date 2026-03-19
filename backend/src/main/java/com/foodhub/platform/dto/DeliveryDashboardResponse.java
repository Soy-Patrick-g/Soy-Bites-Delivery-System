package com.foodhub.platform.dto;

import java.util.List;

public record DeliveryDashboardResponse(
        String driverName,
        String driverEmail,
        List<OrderResponse> availableOrders,
        List<OrderResponse> assignedOrders
) {
}
