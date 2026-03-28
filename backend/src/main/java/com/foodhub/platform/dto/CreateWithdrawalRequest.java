package com.foodhub.platform.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateWithdrawalRequest(
        @NotNull
        @DecimalMin(value = "0.01")
        BigDecimal amount,
        @NotBlank
        String destinationType,
        @NotBlank
        String bankCode,
        @NotBlank
        String accountNumber,
        @NotBlank
        String accountName,
        String reason
) {
}
