package com.foodhub.platform.controller;

import com.foodhub.platform.dto.AuthResponse;
import com.foodhub.platform.dto.CreateBranchRequest;
import com.foodhub.platform.dto.CreateMenuItemRequest;
import com.foodhub.platform.dto.ImageUploadResponse;
import com.foodhub.platform.dto.MenuItemResponse;
import com.foodhub.platform.dto.OrderResponse;
import com.foodhub.platform.dto.OwnerDashboardResponse;
import com.foodhub.platform.dto.RestaurantOwnerRegisterRequest;
import com.foodhub.platform.dto.RestaurantSummaryResponse;
import com.foodhub.platform.dto.CreateWithdrawalRequest;
import com.foodhub.platform.dto.UpdateMenuItemRequest;
import com.foodhub.platform.dto.UpdateMenuItemAvailabilityRequest;
import com.foodhub.platform.dto.WithdrawalBankOptionResponse;
import com.foodhub.platform.dto.WithdrawalDashboardResponse;
import com.foodhub.platform.dto.WithdrawalResponse;
import com.foodhub.platform.service.OwnerPortalService;
import com.foodhub.platform.service.WithdrawalService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {

    private final OwnerPortalService ownerPortalService;
    private final WithdrawalService withdrawalService;

    public OwnerController(OwnerPortalService ownerPortalService, WithdrawalService withdrawalService) {
        this.ownerPortalService = ownerPortalService;
        this.withdrawalService = withdrawalService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RestaurantOwnerRegisterRequest request) {
        return ownerPortalService.registerOwner(request);
    }

    @GetMapping("/dashboard")
    public OwnerDashboardResponse getDashboard(Authentication authentication) {
        return ownerPortalService.getDashboard(authentication.getName());
    }

    @GetMapping("/restaurants/{restaurantId}/menu")
    public List<MenuItemResponse> getRestaurantMenu(@PathVariable Long restaurantId, Authentication authentication) {
        return ownerPortalService.getRestaurantMenu(authentication.getName(), restaurantId);
    }

    @PostMapping("/branches")
    public RestaurantSummaryResponse createBranch(@Valid @RequestBody CreateBranchRequest request,
                                                  Authentication authentication) {
        return ownerPortalService.createBranch(authentication.getName(), request);
    }

    @PostMapping(value = "/uploads/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImageUploadResponse uploadImage(@RequestPart("file") MultipartFile file,
                                           Authentication authentication) {
        return ownerPortalService.uploadMenuImage(authentication.getName(), file);
    }

    @PostMapping("/restaurants/{restaurantId}/menu")
    public MenuItemResponse createMenuItem(@PathVariable Long restaurantId,
                                           @Valid @RequestBody CreateMenuItemRequest request,
                                           Authentication authentication) {
        return ownerPortalService.createMenuItem(authentication.getName(), restaurantId, request);
    }

    @PatchMapping("/restaurants/{restaurantId}/menu/{menuItemId}")
    public MenuItemResponse updateMenuItem(@PathVariable Long restaurantId,
                                           @PathVariable Long menuItemId,
                                           @Valid @RequestBody UpdateMenuItemRequest request,
                                           Authentication authentication) {
        return ownerPortalService.updateMenuItem(authentication.getName(), restaurantId, menuItemId, request);
    }

    @PatchMapping("/restaurants/{restaurantId}/menu/{menuItemId}/availability")
    public MenuItemResponse updateMenuItemAvailability(@PathVariable Long restaurantId,
                                                       @PathVariable Long menuItemId,
                                                       @Valid @RequestBody UpdateMenuItemAvailabilityRequest request,
                                                       Authentication authentication) {
        return ownerPortalService.updateMenuItemAvailability(authentication.getName(), restaurantId, menuItemId, request);
    }

    @PatchMapping("/orders/{orderId}/advance")
    public OrderResponse advanceOrder(@PathVariable Long orderId, Authentication authentication) {
        return ownerPortalService.advanceOrder(authentication.getName(), orderId);
    }

    @GetMapping("/withdrawals")
    public WithdrawalDashboardResponse getWithdrawals(Authentication authentication) {
        return withdrawalService.getDashboard(authentication.getName(), com.foodhub.platform.model.UserRole.RESTAURANT);
    }

    @GetMapping("/withdrawals/banks")
    public List<WithdrawalBankOptionResponse> getWithdrawalBanks() {
        return withdrawalService.getBankOptions();
    }

    @PostMapping("/withdrawals")
    public WithdrawalResponse createWithdrawal(@Valid @RequestBody CreateWithdrawalRequest request,
                                               Authentication authentication) {
        return withdrawalService.createWithdrawal(authentication.getName(), com.foodhub.platform.model.UserRole.RESTAURANT, request);
    }
}
