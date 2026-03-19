package com.foodhub.platform.dto;

import java.util.List;

public record OwnerDashboardResponse(
        String ownerName,
        String ownerEmail,
        List<RestaurantSummaryResponse> restaurants,
        List<OrderResponse> orders
) {
}
