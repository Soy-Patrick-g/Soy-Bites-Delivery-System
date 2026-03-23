package com.foodhub.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateBranchRequest(
        @NotBlank String brandName,
        @NotBlank String branchName,
        @NotBlank String description,
        @NotBlank String cuisine,
        @NotBlank String address,
        @NotBlank String city,
        @NotNull Double latitude,
        @NotNull Double longitude
) {
}
