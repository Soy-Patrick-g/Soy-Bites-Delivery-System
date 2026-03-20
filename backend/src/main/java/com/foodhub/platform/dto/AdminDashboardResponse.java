package com.foodhub.platform.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardResponse(
        long totalRestaurants,
        long totalOrders,
        long totalReviews,
        BigDecimal totalRevenue,
        BigDecimal totalOwnerAllocations,
        List<RestaurantSummaryResponse> topRestaurants
) {
}
