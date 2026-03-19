package com.foodhub.platform.dto;

public record PaymentInitializationResponse(
        String provider,
        String reference,
        String authorizationUrl,
        boolean simulated
) {
}

