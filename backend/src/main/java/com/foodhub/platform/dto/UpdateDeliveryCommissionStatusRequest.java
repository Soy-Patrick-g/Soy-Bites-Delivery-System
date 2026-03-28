package com.foodhub.platform.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateDeliveryCommissionStatusRequest(
        @NotBlank String paymentStatus
) {
}
