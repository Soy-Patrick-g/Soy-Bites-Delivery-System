package com.foodhub.platform.controller;

import com.foodhub.platform.dto.AuthResponse;
import com.foodhub.platform.dto.DeliveryLocationResponse;
import com.foodhub.platform.dto.DeliveryDashboardResponse;
import com.foodhub.platform.dto.DeliveryRegisterRequest;
import com.foodhub.platform.dto.OrderResponse;
import com.foodhub.platform.dto.UpdateLocationRequest;
import com.foodhub.platform.service.DeliveryPortalService;
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
@RequestMapping("/api/delivery")
public class DeliveryController {

    private final DeliveryPortalService deliveryPortalService;

    public DeliveryController(DeliveryPortalService deliveryPortalService) {
        this.deliveryPortalService = deliveryPortalService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody DeliveryRegisterRequest request) {
        return deliveryPortalService.registerDriver(request);
    }

    @GetMapping("/dashboard")
    public DeliveryDashboardResponse getDashboard(Authentication authentication) {
        return deliveryPortalService.getDashboard(authentication.getName());
    }

    @PatchMapping("/location")
    public DeliveryLocationResponse updateLocation(@Valid @RequestBody UpdateLocationRequest request,
                                                   Authentication authentication) {
        return deliveryPortalService.updateCurrentLocation(
                authentication.getName(),
                request.latitude(),
                request.longitude()
        );
    }

    @PatchMapping("/orders/{orderId}/claim")
    public OrderResponse claimOrder(@PathVariable Long orderId, Authentication authentication) {
        return deliveryPortalService.claimOrder(authentication.getName(), orderId);
    }

    @PatchMapping("/orders/{orderId}/unclaim")
    public OrderResponse unclaimOrder(@PathVariable Long orderId, Authentication authentication) {
        return deliveryPortalService.unclaimOrder(authentication.getName(), orderId);
    }

    @PatchMapping("/orders/{orderId}/complete")
    public OrderResponse completeOrder(@PathVariable Long orderId, Authentication authentication) {
        return deliveryPortalService.completeOrder(authentication.getName(), orderId);
    }
}
