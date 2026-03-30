package com.foodhub.platform.dto;

import com.foodhub.platform.model.OrderStatus;
import com.foodhub.platform.model.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        String groupReference,
        Long restaurantId,
        String restaurantName,
        BigDecimal restaurantAverageRating,
        String customerName,
        String customerProfileImageUrl,
        String deliveryPersonName,
        String deliveryPersonEmail,
        String deliveryPersonProfileImageUrl,
        String deliveryPersonVehicleType,
        Long deliveryPersonCompletedDeliveries,
        OrderStatus status,
        PaymentStatus paymentStatus,
        String paymentReference,
        String deliveryAddress,
        Double deliveryLatitude,
        Double deliveryLongitude,
        Double restaurantLatitude,
        Double restaurantLongitude,
        Double distanceKm,
        BigDecimal subtotal,
        BigDecimal deliveryFee,
        BigDecimal ownerAllocation,
        BigDecimal total,
        Instant createdAt,
        Instant completedAt,
        List<OrderItemResponse> items,
        boolean reviewed,
        PaymentInitializationResponse payment
) {
}
