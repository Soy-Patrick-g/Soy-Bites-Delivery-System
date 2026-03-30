package com.foodhub.platform.controller;

import com.foodhub.platform.dto.AuthResponse;
import com.foodhub.platform.dto.DeliveryLocationResponse;
import com.foodhub.platform.dto.DeliveryDashboardResponse;
import com.foodhub.platform.dto.DeliveryRegisterRequest;
import com.foodhub.platform.dto.OrderResponse;
import com.foodhub.platform.dto.UpdateLocationRequest;
import com.foodhub.platform.dto.CreateWithdrawalRequest;
import com.foodhub.platform.dto.WithdrawalBankOptionResponse;
import com.foodhub.platform.dto.WithdrawalDashboardResponse;
import com.foodhub.platform.dto.WithdrawalResponse;
import com.foodhub.platform.service.DeliveryPortalService;
import com.foodhub.platform.service.RequestAuthenticationService;
import com.foodhub.platform.service.WithdrawalService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
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
    private final WithdrawalService withdrawalService;
    private final RequestAuthenticationService requestAuthenticationService;

    public DeliveryController(DeliveryPortalService deliveryPortalService,
                              WithdrawalService withdrawalService,
                              RequestAuthenticationService requestAuthenticationService) {
        this.deliveryPortalService = deliveryPortalService;
        this.withdrawalService = withdrawalService;
        this.requestAuthenticationService = requestAuthenticationService;
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

    @GetMapping("/withdrawals")
    public WithdrawalDashboardResponse getWithdrawals(Authentication authentication) {
        return withdrawalService.getDashboard(authentication.getName(), com.foodhub.platform.model.UserRole.DELIVERY);
    }

    @GetMapping("/withdrawals/banks")
    public List<WithdrawalBankOptionResponse> getWithdrawalBanks(Authentication authentication) {
        return withdrawalService.getBankOptions();
    }

    @PostMapping("/withdrawals")
    public WithdrawalResponse createWithdrawal(@Valid @RequestBody CreateWithdrawalRequest request,
                                               HttpServletRequest httpServletRequest) {
        String userEmail = requestAuthenticationService
                .requireUser(httpServletRequest, com.foodhub.platform.model.UserRole.DELIVERY)
                .getEmail();
        return withdrawalService.createWithdrawal(userEmail, com.foodhub.platform.model.UserRole.DELIVERY, request);
    }
}
