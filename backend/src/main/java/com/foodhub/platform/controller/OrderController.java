package com.foodhub.platform.controller;

import com.foodhub.platform.dto.OrderResponse;
import com.foodhub.platform.dto.PlaceOrderRequest;
import com.foodhub.platform.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public OrderResponse placeOrder(@Valid @RequestBody PlaceOrderRequest request) {
        return orderService.placeOrder(request);
    }

    @GetMapping("/{id}")
    public OrderResponse getOrder(@PathVariable Long id) {
        return orderService.getOrder(id);
    }

    @GetMapping("/history")
    public List<OrderResponse> getCurrentUserOrders(Authentication authentication) {
        return orderService.getOrdersForCurrentUser(authentication.getName());
    }

    @GetMapping
    public List<OrderResponse> getOrdersByCustomer(@RequestParam String email, Authentication authentication) {
        return orderService.getOrdersByCustomerForRequester(authentication.getName(), email);
    }

    @GetMapping("/payment/verify")
    public OrderResponse verifyPayment(@RequestParam String reference) {
        return orderService.verifyPayment(reference);
    }
}
