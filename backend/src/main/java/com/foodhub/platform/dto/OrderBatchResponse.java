package com.foodhub.platform.dto;

import java.math.BigDecimal;
import java.util.List;

public record OrderBatchResponse(
        String groupReference,
        BigDecimal subtotal,
        BigDecimal deliveryFee,
        BigDecimal total,
        List<OrderResponse> orders,
        PaymentInitializationResponse payment
) {
}
