package com.foodhub.platform.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyResetTokenRequest(
        @NotBlank String token
) {
}
