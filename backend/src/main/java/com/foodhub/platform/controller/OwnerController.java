package com.foodhub.platform.controller;

import com.foodhub.platform.dto.AuthResponse;
import com.foodhub.platform.dto.OrderResponse;
import com.foodhub.platform.dto.OwnerDashboardResponse;
import com.foodhub.platform.dto.RestaurantOwnerRegisterRequest;
import com.foodhub.platform.service.OwnerPortalService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {

    private final OwnerPortalService ownerPortalService;

    public OwnerController(OwnerPortalService ownerPortalService) {
        this.ownerPortalService = ownerPortalService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RestaurantOwnerRegisterRequest request) {
        return ownerPortalService.registerOwner(request);
    }

    @GetMapping("/dashboard")
    public OwnerDashboardResponse getDashboard(Authentication authentication) {
        return ownerPortalService.getDashboard(authentication.getName());
    }

    @PatchMapping("/orders/{orderId}/advance")
    public OrderResponse advanceOrder(@PathVariable Long orderId, Authentication authentication) {
        return ownerPortalService.advanceOrder(authentication.getName(), orderId);
    }
}
