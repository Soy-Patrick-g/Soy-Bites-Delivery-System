package com.foodhub.platform.controller;

import com.foodhub.platform.dto.AdminDashboardResponse;
import com.foodhub.platform.dto.OrderResponse;
import com.foodhub.platform.service.AdminDashboardService;
import com.foodhub.platform.service.OrderService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
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

    @PatchMapping("/orders/{orderId}/advance")
    public OrderResponse advanceOrder(@PathVariable Long orderId) {
        return orderService.advanceOrder(orderId);
    }
}

