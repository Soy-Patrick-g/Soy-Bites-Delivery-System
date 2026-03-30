package com.foodhub.platform.controller;

import com.foodhub.platform.dto.CreateWithdrawalRequest;
import com.foodhub.platform.dto.WithdrawalResponse;
import com.foodhub.platform.model.UserRole;
import com.foodhub.platform.service.WithdrawalService;
import jakarta.validation.Valid;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/withdrawal-requests")
public class WithdrawalRequestController {

    private static final Logger log = LoggerFactory.getLogger(WithdrawalRequestController.class);
    private final WithdrawalService withdrawalService;

    public WithdrawalRequestController(WithdrawalService withdrawalService) {
        this.withdrawalService = withdrawalService;
    }

    @PostConstruct
    void logRegistration() {
        log.info("WithdrawalRequestController registered");
    }

    @PostMapping("/delivery")
    public WithdrawalResponse createDeliveryWithdrawal(@Valid @RequestBody CreateWithdrawalRequest request,
                                                       Authentication authentication) {
        log.info("WithdrawalRequestController.createDeliveryWithdrawal invoked for {}", authentication == null ? "anonymous" : authentication.getName());
        try {
            return withdrawalService.createWithdrawal(requireAuthenticatedEmail(authentication, UserRole.DELIVERY), UserRole.DELIVERY, request);
        } catch (ResponseStatusException exception) {
            log.warn("Delivery withdrawal request failed with status {} and message {}", exception.getStatusCode(), exception.getReason());
            throw exception;
        } catch (RuntimeException exception) {
            log.error("Delivery withdrawal request failed unexpectedly", exception);
            throw exception;
        }
    }

    @PostMapping("/owner")
    public WithdrawalResponse createOwnerWithdrawal(@Valid @RequestBody CreateWithdrawalRequest request,
                                                    Authentication authentication) {
        log.info("WithdrawalRequestController.createOwnerWithdrawal invoked for {}", authentication == null ? "anonymous" : authentication.getName());
        try {
            return withdrawalService.createWithdrawal(requireAuthenticatedEmail(authentication, UserRole.RESTAURANT), UserRole.RESTAURANT, request);
        } catch (ResponseStatusException exception) {
            log.warn("Owner withdrawal request failed with status {} and message {}", exception.getStatusCode(), exception.getReason());
            throw exception;
        } catch (RuntimeException exception) {
            log.error("Owner withdrawal request failed unexpectedly", exception);
            throw exception;
        }
    }

    private String requireAuthenticatedEmail(Authentication authentication, UserRole expectedRole) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Your session has ended. Please sign in again and try once more.");
        }

        boolean hasRole = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals("ROLE_" + expectedRole.name()));

        if (!hasRole) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This action is not available for your account.");
        }

        return authentication.getName();
    }
}
