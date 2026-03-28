package com.foodhub.platform.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardResponse(
        long totalRestaurants,
        long totalOrders,
        long totalReviews,
        long totalUsers,
        long activeSessions,
        BigDecimal totalRevenue,
        long transactionsToday,
        long transactionsThisMonth,
        long transactionsThisYear,
        BigDecimal refundsTotal,
        BigDecimal chargebacksTotal,
        BigDecimal netSettlementAmount,
        BigDecimal totalOwnerAllocations,
        long completedDeliveries,
        BigDecimal totalCommissionOwed,
        BigDecimal pendingCommissionTotal,
        BigDecimal paidCommissionTotal,
        List<AdminDeliveryPersonnelEarningsResponse> deliveryPersonnelEarnings,
        List<AdminTrendPointResponse> volumeTrends,
        List<RestaurantSummaryResponse> topRestaurants
) {
}
