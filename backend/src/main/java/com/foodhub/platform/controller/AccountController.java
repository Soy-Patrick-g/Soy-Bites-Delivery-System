package com.foodhub.platform.controller;

import com.foodhub.platform.dto.AccountProfileResponse;
import com.foodhub.platform.dto.UpdateAccountProfileRequest;
import com.foodhub.platform.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/profile")
    public AccountProfileResponse getProfile(Authentication authentication) {
        return accountService.getProfile(authentication.getName());
    }

    @PatchMapping("/profile")
    public AccountProfileResponse updateProfile(@Valid @RequestBody UpdateAccountProfileRequest request,
                                                Authentication authentication) {
        return accountService.updateProfile(authentication.getName(), request);
    }
}
