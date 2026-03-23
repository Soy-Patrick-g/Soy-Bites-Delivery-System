package com.foodhub.platform.dto;

public record ImageUploadResponse(
        String url,
        String publicId,
        String originalFilename
) {
}
