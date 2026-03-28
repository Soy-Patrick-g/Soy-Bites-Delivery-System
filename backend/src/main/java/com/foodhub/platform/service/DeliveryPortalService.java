package com.foodhub.platform.service;

import com.foodhub.platform.dto.AuthResponse;
import com.foodhub.platform.dto.DeliveryLocationResponse;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
    private final UserSessionService userSessionService;
    private final AuditLogService auditLogService;
    private final PaymentService paymentService;
    private final DeliveryCommissionService deliveryCommissionService;
    private final AdminRealtimeService adminRealtimeService;

    public DeliveryPortalService(AppUserRepository appUserRepository,
                                 OrderRepository orderRepository,
                                 PasswordEncoder passwordEncoder,
                                 JwtService jwtService,
                                 CustomUserDetailsService userDetailsService,
                                 UserSessionService userSessionService,
                                 AuditLogService auditLogService,
                                 PaymentService paymentService,
                                 DeliveryCommissionService deliveryCommissionService,
                                 AdminRealtimeService adminRealtimeService) {
        this.appUserRepository = appUserRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.userSessionService = userSessionService;
        this.auditLogService = auditLogService;
        this.paymentService = paymentService;
        this.deliveryCommissionService = deliveryCommissionService;
        this.adminRealtimeService = adminRealtimeService;
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

        var session = userSessionService.createSession(driver, jwtService.calculateExpirationInstant());
        String token = jwtService.generateToken(
                userDetailsService.loadUserByUsername(driver.getEmail()),
                driver.getRole().name(),
                session.getSessionId()
        );
        auditLogService.log(driver.getEmail(), driver.getRole(), "DELIVERY_REGISTER", "USER", String.valueOf(driver.getId()), "Driver registered");
        return new AuthResponse(token, driver.getFullName(), driver.getEmail(), driver.getRole(), session.getExpiresAt());
    }

    @Transactional(readOnly = true)
    public DeliveryDashboardResponse getDashboard(String driverEmail) {
        AppUser driver = appUserRepository.findByEmailIgnoreCase(driverEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        List<OrderResponse> availableOrders = orderRepository
                .findByStatusAndDeliveryPersonIsNullOrderByCreatedAtAsc(OrderStatus.OUT_FOR_DELIVERY)
                .stream()
                .filter(this::isRouteReadyForClaim)
                .map(this::toOrderResponse)
                .toList();

        List<OrderResponse> assignedOrders = collectAssignedRouteOrders(driver.getId()).stream()
                .map(this::toOrderResponse)
                .toList();

        return new DeliveryDashboardResponse(
                driver.getFullName(),
                driver.getEmail(),
                driver.getLatitude(),
                driver.getLongitude(),
                deliveryCommissionService.getDriverSummary(driver.getId()),
                deliveryCommissionService.getDriverCommissions(driver.getId()),
                availableOrders,
                assignedOrders
        );
    }

    @Transactional
    public DeliveryLocationResponse updateCurrentLocation(String driverEmail, Double latitude, Double longitude) {
        AppUser driver = appUserRepository.findByEmailIgnoreCase(driverEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        driver.setLatitude(latitude);
        driver.setLongitude(longitude);
        appUserRepository.save(driver);
        return new DeliveryLocationResponse(driver.getLatitude(), driver.getLongitude());
    }

    @Transactional
    public OrderResponse claimOrder(String driverEmail, Long orderId) {
        AppUser driver = appUserRepository.findByEmailIgnoreCase(driverEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
        FoodOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        List<FoodOrder> routeOrders = resolveDeliveryGroup(order);
        if (routeOrders.stream().anyMatch(current -> current.getStatus() != OrderStatus.OUT_FOR_DELIVERY)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "All orders in this delivery route must be ready before claiming");
        }
        if (routeOrders.stream().anyMatch(current -> current.getDeliveryPerson() != null
                && !current.getDeliveryPerson().getId().equals(driver.getId()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This delivery route has already been claimed");
        }

        List<FoodOrder> savedOrders = new ArrayList<>();
        for (FoodOrder routeOrder : routeOrders) {
            routeOrder.setDeliveryPerson(driver);
            savedOrders.add(orderRepository.save(routeOrder));
        }

        FoodOrder saved = savedOrders.stream()
                .filter(current -> current.getId().equals(orderId))
                .findFirst()
                .orElse(savedOrders.get(0));

        if (isGroupedRoute(order)) {
            auditLogService.log(
                    driver.getEmail(),
                    driver.getRole(),
                    "DELIVERY_CLAIM_GROUP",
                    "ORDER_GROUP",
                    order.getGroupReference(),
                    "Driver claimed combined delivery for " + routeOrders.size() + " restaurant orders"
            );
        } else {
            auditLogService.log(driver.getEmail(), driver.getRole(), "DELIVERY_CLAIM", "ORDER", String.valueOf(saved.getId()), "Driver claimed delivery");
        }
        return toOrderResponse(saved);
    }

    @Transactional
    public OrderResponse completeOrder(String driverEmail, Long orderId) {
        AppUser driver = appUserRepository.findByEmailIgnoreCase(driverEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
        FoodOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        List<FoodOrder> routeOrders = resolveDeliveryGroup(order);
        boolean assignedToDriver = routeOrders.stream().anyMatch(current -> current.getDeliveryPerson() != null
                && current.getDeliveryPerson().getId().equals(driver.getId()));
        boolean routeUnassigned = routeOrders.stream().allMatch(current -> current.getDeliveryPerson() == null);

        if (!assignedToDriver && routeUnassigned) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Claim this route before marking it delivered");
        }
        if (!assignedToDriver) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only complete orders assigned to you");
        }
        if (routeOrders.stream().anyMatch(current -> current.getDeliveryPerson() != null
                && !current.getDeliveryPerson().getId().equals(driver.getId()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This delivery route is assigned to another rider");
        }
        if (routeOrders.stream().anyMatch(current -> current.getStatus() != OrderStatus.OUT_FOR_DELIVERY)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only active deliveries can be completed");
        }

        List<FoodOrder> savedOrders = new ArrayList<>();
        for (FoodOrder routeOrder : routeOrders) {
            if (routeOrder.getDeliveryPerson() == null) {
                routeOrder.setDeliveryPerson(driver);
            }
            routeOrder.setStatus(OrderStatus.DELIVERED);
            savedOrders.add(orderRepository.save(routeOrder));
        }

        FoodOrder saved = savedOrders.stream()
                .filter(current -> current.getId().equals(orderId))
                .findFirst()
                .orElse(savedOrders.get(0));

        if (isGroupedRoute(order)) {
            auditLogService.log(
                    driver.getEmail(),
                    driver.getRole(),
                    "DELIVERY_COMPLETE_GROUP",
                    "ORDER_GROUP",
                    order.getGroupReference(),
                    "Driver completed combined delivery for " + routeOrders.size() + " restaurant orders"
            );
        } else {
            auditLogService.log(driver.getEmail(), driver.getRole(), "DELIVERY_COMPLETE", "ORDER", String.valueOf(saved.getId()), "Driver completed delivery");
        }
        deliveryCommissionService.recordCompletedDeliveries(savedOrders);
        adminRealtimeService.publish("delivery_completed", Map.of(
                "orderId", saved.getId(),
                "groupReference", saved.getGroupReference(),
                "driverEmail", driver.getEmail()
        ));
        return toOrderResponse(saved);
    }

    @Transactional
    public OrderResponse unclaimOrder(String driverEmail, Long orderId) {
        AppUser driver = appUserRepository.findByEmailIgnoreCase(driverEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
        FoodOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        List<FoodOrder> routeOrders = resolveDeliveryGroup(order);
        boolean assignedToDriver = routeOrders.stream().anyMatch(current -> current.getDeliveryPerson() != null
                && current.getDeliveryPerson().getId().equals(driver.getId()));
        boolean routeUnassigned = routeOrders.stream().allMatch(current -> current.getDeliveryPerson() == null);

        if (!assignedToDriver && routeUnassigned) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This route is not currently assigned to any rider");
        }
        if (!assignedToDriver) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only unclaim deliveries assigned to you");
        }
        if (routeOrders.stream().anyMatch(current -> current.getStatus() != OrderStatus.OUT_FOR_DELIVERY)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only active deliveries can be unclaimed");
        }
        if (routeOrders.stream().anyMatch(current -> current.getDeliveryPerson() != null
                && !current.getDeliveryPerson().getId().equals(driver.getId()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This delivery route is assigned to another rider");
        }

        List<FoodOrder> savedOrders = new ArrayList<>();
        for (FoodOrder routeOrder : routeOrders) {
            routeOrder.setDeliveryPerson(null);
            savedOrders.add(orderRepository.save(routeOrder));
        }

        FoodOrder saved = savedOrders.stream()
                .filter(current -> current.getId().equals(orderId))
                .findFirst()
                .orElse(savedOrders.get(0));

        if (isGroupedRoute(order)) {
            auditLogService.log(
                    driver.getEmail(),
                    driver.getRole(),
                    "DELIVERY_UNCLAIM_GROUP",
                    "ORDER_GROUP",
                    order.getGroupReference(),
                    "Driver released combined delivery for " + routeOrders.size() + " restaurant orders"
            );
        } else {
            auditLogService.log(driver.getEmail(), driver.getRole(), "DELIVERY_UNCLAIM", "ORDER", String.valueOf(saved.getId()), "Driver unclaimed delivery");
        }
        return toOrderResponse(saved);
    }

    private boolean isRouteReadyForClaim(FoodOrder order) {
        return resolveDeliveryGroup(order).stream()
                .allMatch(current -> current.getStatus() == OrderStatus.OUT_FOR_DELIVERY && current.getDeliveryPerson() == null);
    }

    private List<FoodOrder> collectAssignedRouteOrders(Long driverId) {
        Map<Long, FoodOrder> assignedRouteOrders = new LinkedHashMap<>();

        for (FoodOrder assignedOrder : orderRepository.findByDeliveryPersonIdOrderByCreatedAtDesc(driverId)) {
            for (FoodOrder routeOrder : resolveDeliveryGroup(assignedOrder)) {
                assignedRouteOrders.put(routeOrder.getId(), routeOrder);
            }
        }

        return assignedRouteOrders.values().stream()
                .sorted(Comparator.comparing(FoodOrder::getCreatedAt).reversed())
                .toList();
    }

    private List<FoodOrder> resolveDeliveryGroup(FoodOrder order) {
        if (!isGroupedRoute(order)) {
            return List.of(order);
        }
        return orderRepository.findByGroupReferenceOrderByCreatedAtAsc(order.getGroupReference());
    }

    private boolean isGroupedRoute(FoodOrder order) {
        return order.getGroupReference() != null && !order.getGroupReference().isBlank();
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
                order.getDeliveryLatitude(),
                order.getDeliveryLongitude(),
                order.getRestaurant().getLatitude(),
                order.getRestaurant().getLongitude(),
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
