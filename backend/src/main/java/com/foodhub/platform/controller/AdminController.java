package com.foodhub.platform.controller;

import com.foodhub.platform.dto.AdminAuditLogResponse;
import com.foodhub.platform.dto.AdminDashboardResponse;
import com.foodhub.platform.dto.AdminSessionResponse;
import com.foodhub.platform.dto.AdminTransactionResponse;
import com.foodhub.platform.dto.AdminUserInsightResponse;
import com.foodhub.platform.dto.OrderResponse;
import com.foodhub.platform.service.AdminDashboardService;
import com.foodhub.platform.service.OrderService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminDashboardService adminDashboardService;
    private final OrderService orderService;

    public AdminController(AdminDashboardService adminDashboardService, OrderService orderService) {
        this.adminDashboardService = adminDashboardService;
        this.orderService = orderService;
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

    @PatchMapping("/orders/{orderId}/advance")
    public OrderResponse advanceOrder(@PathVariable Long orderId, Authentication authentication) {
        return orderService.advanceOrder(orderId, authentication.getName());
    }
}
