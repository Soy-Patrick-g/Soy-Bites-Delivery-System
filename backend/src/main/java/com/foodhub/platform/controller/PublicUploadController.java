package com.foodhub.platform.controller;

import com.foodhub.platform.dto.ImageUploadResponse;
import com.foodhub.platform.service.CloudinaryImageService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
public class PublicUploadController {

    private final CloudinaryImageService cloudinaryImageService;

    public PublicUploadController(CloudinaryImageService cloudinaryImageService) {
        this.cloudinaryImageService = cloudinaryImageService;
    }

    @PostMapping(value = "/profile-images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImageUploadResponse uploadProfileImage(@RequestPart("file") MultipartFile file) {
        return cloudinaryImageService.uploadProfileImage(file);
    }
}
