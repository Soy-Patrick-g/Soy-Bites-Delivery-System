package com.foodhub.platform.service;

import com.foodhub.platform.dto.AccountProfileResponse;
import com.foodhub.platform.dto.UpdateAccountProfileRequest;
import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.repository.AppUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountService {

    private final AppUserRepository appUserRepository;
    private final AuditLogService auditLogService;

    public AccountService(AppUserRepository appUserRepository, AuditLogService auditLogService) {
        this.appUserRepository = appUserRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public AccountProfileResponse getProfile(String email) {
        AppUser user = findUser(email);
        return toResponse(user);
    }

    @Transactional
    public AccountProfileResponse updateProfile(String email, UpdateAccountProfileRequest request) {
        AppUser user = findUser(email);
        user.setFullName(request.fullName().trim());
        user.setProfileImageUrl(blankToNull(request.profileImageUrl()));
        AppUser saved = appUserRepository.save(user);
        auditLogService.log(saved.getEmail(), saved.getRole(), "ACCOUNT_PROFILE_UPDATE", "USER", String.valueOf(saved.getId()), "Profile details updated");
        return toResponse(saved);
    }

    private AppUser findUser(String email) {
        return appUserRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
    }

    private AccountProfileResponse toResponse(AppUser user) {
        return new AccountProfileResponse(
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getProfileImageUrl()
        );
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
