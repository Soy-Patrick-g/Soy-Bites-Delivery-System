package com.foodhub.platform.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.foodhub.platform.config.CloudinaryProperties;
import com.foodhub.platform.dto.ImageUploadResponse;
import java.io.IOException;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CloudinaryImageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    private final CloudinaryProperties properties;
    private volatile Cloudinary cloudinary;

    public CloudinaryImageService(CloudinaryProperties properties) {
        this.properties = properties;
    }

    public ImageUploadResponse uploadMenuImage(MultipartFile file) {
        if (!isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Cloudinary is not configured yet. Set the Cloudinary environment variables first."
            );
        }
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose an image file to upload");
        }
        if (file.getContentType() == null || !ALLOWED_CONTENT_TYPES.contains(file.getContentType().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPG, PNG, WEBP, and GIF images are supported");
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = getCloudinary().uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", properties.getFolder(),
                            "resource_type", "image",
                            "overwrite", false,
                            "unique_filename", true
                    )
            );

            String secureUrl = String.valueOf(result.get("secure_url"));
            String publicId = String.valueOf(result.get("public_id"));
            return new ImageUploadResponse(secureUrl, publicId, file.getOriginalFilename());
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Cloudinary upload failed", exception);
        }
    }

    private boolean isConfigured() {
        return properties.isEnabled()
                && hasText(properties.getCloudName())
                && hasText(properties.getApiKey())
                && hasText(properties.getApiSecret());
    }

    private Cloudinary getCloudinary() {
        Cloudinary existing = cloudinary;
        if (existing != null) {
            return existing;
        }

        synchronized (this) {
            if (cloudinary == null) {
                cloudinary = new Cloudinary(ObjectUtils.asMap(
                        "cloud_name", properties.getCloudName(),
                        "api_key", properties.getApiKey(),
                        "api_secret", properties.getApiSecret(),
                        "secure", true
                ));
            }
            return cloudinary;
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
