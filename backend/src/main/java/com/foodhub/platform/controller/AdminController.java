package com.foodhub.platform.controller;

import com.foodhub.platform.dto.AdminAuditLogResponse;
import com.foodhub.platform.dto.AdminDashboardResponse;
import com.foodhub.platform.dto.AdminDeliveryCommissionResponse;
import com.foodhub.platform.dto.AdminDeliverySettingsResponse;
import com.foodhub.platform.dto.AdminRestaurantResponse;
import com.foodhub.platform.dto.AdminSessionResponse;
import com.foodhub.platform.dto.AdminTransactionResponse;
import com.foodhub.platform.dto.AdminUserInsightResponse;
import com.foodhub.platform.dto.AdminWithdrawalResponse;
import com.foodhub.platform.dto.OrderResponse;
import com.foodhub.platform.dto.RejectWithdrawalRequest;
import com.foodhub.platform.dto.UpdateAccountStatusRequest;
import com.foodhub.platform.dto.UpdateDeliveryCommissionStatusRequest;
import com.foodhub.platform.dto.UpdateDeliverySettingsRequest;
import com.foodhub.platform.dto.UpdateRestaurantStatusRequest;
import com.foodhub.platform.dto.UpdateRestaurantVerificationRequest;
import com.foodhub.platform.service.AdminDashboardService;
import com.foodhub.platform.service.DeliveryCommissionService;
import com.foodhub.platform.service.DeliverySettingsService;
import com.foodhub.platform.service.OrderService;
import com.foodhub.platform.service.WithdrawalService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminDashboardService adminDashboardService;
    private final OrderService orderService;
    private final DeliverySettingsService deliverySettingsService;
    private final DeliveryCommissionService deliveryCommissionService;
    private final WithdrawalService withdrawalService;

    public AdminController(AdminDashboardService adminDashboardService,
                           OrderService orderService,
                           DeliverySettingsService deliverySettingsService,
                           DeliveryCommissionService deliveryCommissionService,
                           WithdrawalService withdrawalService) {
        this.adminDashboardService = adminDashboardService;
        this.orderService = orderService;
        this.deliverySettingsService = deliverySettingsService;
        this.deliveryCommissionService = deliveryCommissionService;
        this.withdrawalService = withdrawalService;
    }

    @GetMapping("/dashboard")
    public AdminDashboardResponse dashboard() {
        return adminDashboardService.getDashboard();
    }

    @GetMapping("/transactions")
    public List<AdminTransactionResponse> transactions(@RequestParam(required = false) Instant start,
                                                       @RequestParam(required = false) Instant end,
                                                       @RequestParam(required = false) String status,
                                                       @RequestParam(required = false) BigDecimal minAmount,
                                                       @RequestParam(required = false) BigDecimal maxAmount,
                                                       @RequestParam(required = false) String search,
                                                       @RequestParam(required = false) String sortBy,
                                                       @RequestParam(required = false) String sortDirection) {
        return adminDashboardService.getTransactions(start, end, status, minAmount, maxAmount, search, sortBy, sortDirection);
    }

    @GetMapping(value = "/transactions/export", produces = "text/csv")
    public ResponseEntity<String> exportTransactions(@RequestParam(required = false) Instant start,
                                                     @RequestParam(required = false) Instant end,
                                                     @RequestParam(required = false) String status,
                                                     @RequestParam(required = false) BigDecimal minAmount,
                                                     @RequestParam(required = false) BigDecimal maxAmount,
                                                     @RequestParam(required = false) String search,
                                                     @RequestParam(required = false) String sortBy,
                                                     @RequestParam(required = false) String sortDirection) {
        String csv = adminDashboardService.exportTransactionsCsv(start, end, status, minAmount, maxAmount, search, sortBy, sortDirection);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=transactions.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/audit-logs")
    public List<AdminAuditLogResponse> auditLogs() {
        return adminDashboardService.getAuditLogs();
    }

    @GetMapping("/sessions")
    public List<AdminSessionResponse> sessions() {
        return adminDashboardService.getSessions();
    }

    @GetMapping("/users")
    public List<AdminUserInsightResponse> users(@RequestParam(required = false) String search) {
        return adminDashboardService.getUserInsights(search);
    }

    @PatchMapping("/users/{userId}/status")
    public AdminUserInsightResponse updateUserStatus(@PathVariable Long userId,
                                                     @Valid @RequestBody UpdateAccountStatusRequest request,
                                                     Authentication authentication) {
        return adminDashboardService.updateUserActiveStatus(userId, request.active(), authentication.getName());
    }

    @DeleteMapping("/users/{userId}")
    public void deleteUser(@PathVariable Long userId, Authentication authentication) {
        adminDashboardService.deleteUser(userId, authentication.getName());
    }

    @GetMapping("/restaurants")
    public List<AdminRestaurantResponse> restaurants(@RequestParam(required = false) String search) {
        return adminDashboardService.getRestaurants(search);
    }

    @GetMapping("/delivery-commissions")
    public List<AdminDeliveryCommissionResponse> deliveryCommissions() {
        return adminDashboardService.getDeliveryCommissions();
    }

    @GetMapping("/withdrawals")
    public List<AdminWithdrawalResponse> withdrawals() {
        return withdrawalService.getAdminWithdrawals();
    }

    @PatchMapping("/withdrawals/{withdrawalId}/approve")
    public AdminWithdrawalResponse approveWithdrawal(@PathVariable Long withdrawalId, Authentication authentication) {
        return withdrawalService.approveWithdrawal(withdrawalId, authentication.getName());
    }

    @PatchMapping("/withdrawals/{withdrawalId}/reject")
    public AdminWithdrawalResponse rejectWithdrawal(@PathVariable Long withdrawalId,
                                                    @RequestBody(required = false) RejectWithdrawalRequest request,
                                                    Authentication authentication) {
        return withdrawalService.rejectWithdrawal(withdrawalId, authentication.getName(), request == null ? null : request.reason());
    }

    @PatchMapping("/withdrawals/{withdrawalId}/pay")
    public AdminWithdrawalResponse payWithdrawal(@PathVariable Long withdrawalId, Authentication authentication) {
        return withdrawalService.processApprovedWithdrawal(withdrawalId, authentication.getName());
    }

    @PatchMapping("/delivery-commissions/{commissionId}/status")
    public AdminDeliveryCommissionResponse updateDeliveryCommissionStatus(@PathVariable Long commissionId,
                                                                         @Valid @RequestBody UpdateDeliveryCommissionStatusRequest request,
                                                                         Authentication authentication) {
        return deliveryCommissionService.updateCommissionPaymentStatus(commissionId, request, authentication.getName());
    }

    @GetMapping("/settings/delivery")
    public AdminDeliverySettingsResponse deliverySettings() {
        return adminDashboardService.getDeliverySettings();
    }

    @PatchMapping("/settings/delivery")
    public AdminDeliverySettingsResponse updateDeliverySettings(@Valid @RequestBody UpdateDeliverySettingsRequest request) {
        return deliverySettingsService.updateSettings(request);
    }

    @PatchMapping("/restaurants/{restaurantId}/verification")
    public AdminRestaurantResponse updateRestaurantVerification(@PathVariable Long restaurantId,
                                                               @Valid @RequestBody UpdateRestaurantVerificationRequest request,
                                                               Authentication authentication) {
        return adminDashboardService.updateRestaurantVerification(restaurantId, request.verified(), authentication.getName());
    }

    @PatchMapping("/restaurants/{restaurantId}/status")
    public AdminRestaurantResponse updateRestaurantStatus(@PathVariable Long restaurantId,
                                                          @Valid @RequestBody UpdateRestaurantStatusRequest request,
                                                          Authentication authentication) {
        return adminDashboardService.updateRestaurantActiveStatus(restaurantId, request.active(), authentication.getName());
    }

    @PatchMapping("/orders/{orderId}/advance")
    public OrderResponse advanceOrder(@PathVariable Long orderId, Authentication authentication) {
        return orderService.advanceOrder(orderId, authentication.getName());
    }
}
