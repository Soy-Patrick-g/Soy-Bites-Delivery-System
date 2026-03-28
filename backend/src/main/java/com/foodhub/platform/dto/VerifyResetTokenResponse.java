package com.foodhub.platform.dto;

public record VerifyResetTokenResponse(
        boolean valid,
        String message
) {
}
