package com.foodhub.platform.service;

import com.foodhub.platform.dto.AuthResponse;
import com.foodhub.platform.dto.DeliveryDashboardResponse;
import com.foodhub.platform.dto.DeliveryRegisterRequest;
import com.foodhub.platform.dto.OrderItemResponse;
import com.foodhub.platform.dto.OrderResponse;
import com.foodhub.platform.dto.PaymentInitializationResponse;
import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.model.FoodOrder;
import com.foodhub.platform.model.OrderItem;
import com.foodhub.platform.model.OrderStatus;
import com.foodhub.platform.model.UserRole;
import com.foodhub.platform.repository.AppUserRepository;
import com.foodhub.platform.repository.OrderRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DeliveryPortalService {

    private final AppUserRepository appUserRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final PaymentService paymentService;

    public DeliveryPortalService(AppUserRepository appUserRepository,
                                 OrderRepository orderRepository,
                                 PasswordEncoder passwordEncoder,
                                 JwtService jwtService,
                                 CustomUserDetailsService userDetailsService,
                                 PaymentService paymentService) {
        this.appUserRepository = appUserRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.paymentService = paymentService;
    }

    @Transactional
    public AuthResponse registerDriver(DeliveryRegisterRequest request) {
        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        AppUser driver = new AppUser();
        driver.setFullName(request.fullName() + " - " + request.vehicleType());
        driver.setEmail(request.email());
        driver.setPassword(passwordEncoder.encode(request.password()));
        driver.setRole(UserRole.DELIVERY);
        driver.setLatitude(request.latitude());
        driver.setLongitude(request.longitude());
        appUserRepository.save(driver);

        String token = jwtService.generateToken(
                userDetailsService.loadUserByUsername(driver.getEmail()),
                driver.getRole().name()
        );
        return new AuthResponse(token, driver.getFullName(), driver.getEmail(), driver.getRole());
    }

    @Transactional(readOnly = true)
    public DeliveryDashboardResponse getDashboard(String driverEmail) {
        AppUser driver = appUserRepository.findByEmailIgnoreCase(driverEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        List<OrderResponse> availableOrders = orderRepository
                .findByStatusAndDeliveryPersonIsNullOrderByCreatedAtAsc(OrderStatus.OUT_FOR_DELIVERY)
                .stream()
                .map(this::toOrderResponse)
                .toList();

        List<OrderResponse> assignedOrders = orderRepository.findByDeliveryPersonIdOrderByCreatedAtDesc(driver.getId())
                .stream()
                .map(this::toOrderResponse)
                .toList();

        return new DeliveryDashboardResponse(driver.getFullName(), driver.getEmail(), availableOrders, assignedOrders);
    }

    @Transactional
    public OrderResponse claimOrder(String driverEmail, Long orderId) {
        AppUser driver = appUserRepository.findByEmailIgnoreCase(driverEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
        FoodOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getStatus() != OrderStatus.OUT_FOR_DELIVERY) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order is not ready for delivery");
        }
        if (order.getDeliveryPerson() != null && !order.getDeliveryPerson().getId().equals(driver.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order has already been claimed");
        }

        order.setDeliveryPerson(driver);
        return toOrderResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse completeOrder(String driverEmail, Long orderId) {
        AppUser driver = appUserRepository.findByEmailIgnoreCase(driverEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
        FoodOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getDeliveryPerson() == null || !order.getDeliveryPerson().getId().equals(driver.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only complete orders assigned to you");
        }
        if (order.getStatus() != OrderStatus.OUT_FOR_DELIVERY) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only active deliveries can be completed");
        }

        order.setStatus(OrderStatus.DELIVERED);
        return toOrderResponse(orderRepository.save(order));
    }

    private OrderResponse toOrderResponse(FoodOrder order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(this::toOrderItemResponse)
                .toList();

        PaymentInitializationResponse payment = paymentService.getPaymentDetails(order);
        return new OrderResponse(
                order.getId(),
                order.getGroupReference(),
                order.getRestaurant().getName(),
                order.getCustomer().getFullName(),
                order.getDeliveryPerson() == null ? null : order.getDeliveryPerson().getFullName(),
                order.getDeliveryPerson() == null ? null : order.getDeliveryPerson().getEmail(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getPaymentReference(),
                order.getDeliveryAddress(),
                order.getDistanceKm(),
                order.getSubtotal(),
                order.getDeliveryFee(),
                order.getSubtotal(),
                order.getTotal(),
                order.getCreatedAt(),
                items,
                false,
                payment
        );
    }

    private OrderItemResponse toOrderItemResponse(OrderItem item) {
        return new OrderItemResponse(
                item.getId(),
                item.getMenuItem().getId(),
                item.getMenuItem().getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getTotalPrice()
        );
    }
}
