package com.foodhub.platform.dto;

import com.foodhub.platform.model.OrderStatus;
import com.foodhub.platform.model.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        String groupReference,
        String restaurantName,
        String customerName,
        String deliveryPersonName,
        String deliveryPersonEmail,
        OrderStatus status,
        PaymentStatus paymentStatus,
        String paymentReference,
        String deliveryAddress,
        Double distanceKm,
        BigDecimal subtotal,
        BigDecimal deliveryFee,
        BigDecimal ownerAllocation,
        BigDecimal total,
        Instant createdAt,
        List<OrderItemResponse> items,
        boolean reviewed,
        PaymentInitializationResponse payment
) {
}
