package com.foodhub.platform.controller;

import com.foodhub.platform.dto.AuthRequest;
import com.foodhub.platform.dto.AuthResponse;
import com.foodhub.platform.dto.RegisterRequest;
import com.foodhub.platform.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    public void logout(@RequestHeader(name = "Authorization", required = false) String authorization,
                       Authentication authentication) {
        if (authentication != null) {
            authService.logout(authorization, authentication.getName());
        }
    }
}
