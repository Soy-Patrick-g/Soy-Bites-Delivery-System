package com.foodhub.platform.service;

import com.foodhub.platform.dto.OrderItemResponse;
import com.foodhub.platform.dto.OrderResponse;
import com.foodhub.platform.dto.OrderBatchResponse;
import com.foodhub.platform.dto.PaymentInitializationResponse;
import com.foodhub.platform.dto.PlaceGroupOrderRequest;
import com.foodhub.platform.dto.PlaceOrderRequest;
import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.model.FoodOrder;
import com.foodhub.platform.model.MenuItem;
import com.foodhub.platform.model.OrderItem;
import com.foodhub.platform.model.OrderStatus;
import com.foodhub.platform.model.PaymentStatus;
import com.foodhub.platform.model.Restaurant;
import com.foodhub.platform.model.UserRole;
import com.foodhub.platform.repository.AppUserRepository;
import com.foodhub.platform.repository.MenuItemRepository;
import com.foodhub.platform.repository.OrderRepository;
import com.foodhub.platform.repository.RestaurantRepository;
import com.foodhub.platform.repository.ReviewRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrderService {

    private final AppUserRepository appUserRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final GeoService geoService;
    private final PaymentService paymentService;
    private final AuditLogService auditLogService;

    public OrderService(AppUserRepository appUserRepository,
                        RestaurantRepository restaurantRepository,
                        MenuItemRepository menuItemRepository,
                        OrderRepository orderRepository,
                        ReviewRepository reviewRepository,
                        GeoService geoService,
                        PaymentService paymentService,
                        AuditLogService auditLogService) {
        this.appUserRepository = appUserRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
        this.geoService = geoService;
        this.paymentService = paymentService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public OrderResponse placeOrder(String requesterEmail, PlaceOrderRequest request) {
        AppUser requester = appUserRepository.findByEmailIgnoreCase(requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requester not found"));
        if (requester.getRole() != UserRole.USER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only customers can place orders");
        }
        if (!requester.getEmail().equalsIgnoreCase(request.customerEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only place orders for your own customer account");
        }

        AppUser customer = appUserRepository.findByEmailIgnoreCase(request.customerEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
        Restaurant restaurant = restaurantRepository.findById(request.restaurantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restaurant not found"));

        FoodOrder order = new FoodOrder();
        order.setCustomer(customer);
        order.setRestaurant(restaurant);
        order.setDeliveryAddress(request.deliveryAddress());
        order.setDeliveryLatitude(request.deliveryLatitude());
        order.setDeliveryLongitude(request.deliveryLongitude());

        BigDecimal subtotal = BigDecimal.ZERO;
        for (var itemRequest : request.items()) {
            MenuItem menuItem = menuItemRepository.findById(itemRequest.menuItemId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));
            if (!menuItem.getRestaurant().getId().equals(restaurant.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All items must belong to the same restaurant");
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(itemRequest.quantity());
            orderItem.setUnitPrice(menuItem.getPrice());
            orderItem.setTotalPrice(menuItem.getPrice().multiply(BigDecimal.valueOf(itemRequest.quantity())));
            subtotal = subtotal.add(orderItem.getTotalPrice());
            order.addItem(orderItem);
        }

        double distanceKm = geoService.distanceInKm(
                request.deliveryLatitude(),
                request.deliveryLongitude(),
                restaurant.getLatitude(),
                restaurant.getLongitude()
        );

        BigDecimal deliveryFee = geoService.calculateDeliveryFee(distanceKm);
        order.setDistanceKm(distanceKm);
        order.setSubtotal(subtotal);
        order.setDeliveryFee(deliveryFee);
        order.setTotal(subtotal.add(deliveryFee));

        FoodOrder saved = orderRepository.save(order);
        PaymentInitializationResponse payment = paymentService.initializeTransaction(saved);
        auditLogService.log(customer.getEmail(), customer.getRole(), "ORDER_PLACE", "ORDER", String.valueOf(saved.getId()), "Single restaurant order created");

        return toResponse(orderRepository.save(saved), payment);
    }

    @Transactional
    public OrderBatchResponse placeGroupOrder(String requesterEmail, PlaceGroupOrderRequest request) {
        AppUser requester = appUserRepository.findByEmailIgnoreCase(requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requester not found"));
        if (requester.getRole() != UserRole.USER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only customers can place orders");
        }
        if (!requester.getEmail().equalsIgnoreCase(request.customerEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only place orders for your own customer account");
        }

        AppUser customer = appUserRepository.findByEmailIgnoreCase(request.customerEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        String groupReference = "FH-GRP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        var groupedRequests = request.items().stream()
                .collect(java.util.stream.Collectors.groupingBy(itemRequest -> {
                    MenuItem menuItem = menuItemRepository.findById(itemRequest.menuItemId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));
                    return menuItem.getRestaurant();
                }));

        List<FoodOrder> savedOrders = new ArrayList<>();
        BigDecimal combinedSubtotal = BigDecimal.ZERO;
        BigDecimal combinedDeliveryFee = BigDecimal.ZERO;

        for (var entry : groupedRequests.entrySet()) {
            Restaurant restaurant = entry.getKey();
            FoodOrder order = new FoodOrder();
            order.setCustomer(customer);
            order.setRestaurant(restaurant);
            order.setDeliveryAddress(request.deliveryAddress());
            order.setDeliveryLatitude(request.deliveryLatitude());
            order.setDeliveryLongitude(request.deliveryLongitude());
            order.setGroupReference(groupReference);

            BigDecimal subtotal = BigDecimal.ZERO;
            for (var itemRequest : entry.getValue()) {
                MenuItem menuItem = menuItemRepository.findById(itemRequest.menuItemId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));

                OrderItem orderItem = new OrderItem();
                orderItem.setMenuItem(menuItem);
                orderItem.setQuantity(itemRequest.quantity());
                orderItem.setUnitPrice(menuItem.getPrice());
                orderItem.setTotalPrice(menuItem.getPrice().multiply(BigDecimal.valueOf(itemRequest.quantity())));
                subtotal = subtotal.add(orderItem.getTotalPrice());
                order.addItem(orderItem);
            }

            double distanceKm = geoService.distanceInKm(
                    request.deliveryLatitude(),
                    request.deliveryLongitude(),
                    restaurant.getLatitude(),
                    restaurant.getLongitude()
            );

            BigDecimal deliveryFee = geoService.calculateDeliveryFee(distanceKm);
            order.setDistanceKm(distanceKm);
            order.setSubtotal(subtotal);
            order.setDeliveryFee(deliveryFee);
            order.setTotal(subtotal.add(deliveryFee));

            savedOrders.add(orderRepository.save(order));
            combinedSubtotal = combinedSubtotal.add(subtotal);
            combinedDeliveryFee = combinedDeliveryFee.add(deliveryFee);
        }

        FoodOrder primaryOrder = savedOrders.get(0);
        PaymentInitializationResponse payment = paymentService.initializeTransaction(
                primaryOrder,
                combinedSubtotal.add(combinedDeliveryFee),
                "Combined multi-restaurant checkout"
        );

        List<FoodOrder> finalizedOrders = savedOrders.stream()
                .map(order -> {
                    order.setPaymentReference(payment.reference());
                    order.setPaymentStatus(primaryOrder.getPaymentStatus());
                    return orderRepository.save(order);
                })
                .toList();
        auditLogService.log(customer.getEmail(), customer.getRole(), "ORDER_BATCH_PLACE", "ORDER_GROUP", groupReference, "Combined order spanning " + finalizedOrders.size() + " restaurant orders");

        return new OrderBatchResponse(
                groupReference,
                combinedSubtotal,
                combinedDeliveryFee,
                combinedSubtotal.add(combinedDeliveryFee),
                finalizedOrders.stream().map(order -> toResponse(order, paymentService.getPaymentDetails(order))).toList(),
                payment
        );
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long id, String requesterEmail) {
        FoodOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        authorizeOrderAccess(order, requesterEmail);
        return toResponse(order, paymentService.getPaymentDetails(order));
    }

    @Transactional(readOnly = true)
    public OrderBatchResponse getOrderBatch(Long id, String requesterEmail) {
        FoodOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        AppUser requester = appUserRepository.findByEmailIgnoreCase(requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requester not found"));

        if (requester.getRole() != UserRole.ADMIN
                && (requester.getRole() != UserRole.USER
                || !order.getCustomer().getEmail().equalsIgnoreCase(requesterEmail))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Combined receipts are only available to the customer who placed the order");
        }

        List<FoodOrder> orders = (order.getGroupReference() == null || order.getGroupReference().isBlank())
                ? List.of(order)
                : orderRepository.findByGroupReferenceOrderByCreatedAtAsc(order.getGroupReference());

        BigDecimal subtotal = orders.stream()
                .map(FoodOrder::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal deliveryFee = orders.stream()
                .map(FoodOrder::getDeliveryFee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new OrderBatchResponse(
                order.getGroupReference() == null || order.getGroupReference().isBlank() ? "ORDER-" + order.getId() : order.getGroupReference(),
                subtotal,
                deliveryFee,
                subtotal.add(deliveryFee),
                orders.stream().map(current -> toResponse(current, paymentService.getPaymentDetails(current))).toList(),
                paymentService.getPaymentDetails(order)
        );
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByCustomer(String email) {
        AppUser customer = appUserRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(order -> toResponse(order, paymentService.getPaymentDetails(order)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersForCurrentUser(String email) {
        return getOrdersByCustomer(email);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByCustomerForRequester(String requesterEmail, String targetEmail) {
        AppUser requester = appUserRepository.findByEmailIgnoreCase(requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requester not found"));

        if (!requester.getEmail().equalsIgnoreCase(targetEmail) && requester.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view your own order history");
        }

        return getOrdersByCustomer(targetEmail);
    }

    @Transactional
    public OrderResponse advanceOrder(Long orderId, String actorEmail) {
        FoodOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        OrderStatus nextStatus = switch (order.getStatus()) {
            case RECEIVED -> OrderStatus.PREPARING;
            case PREPARING -> OrderStatus.OUT_FOR_DELIVERY;
            case OUT_FOR_DELIVERY -> OrderStatus.DELIVERED;
            case DELIVERED -> OrderStatus.DELIVERED;
        };
        order.setStatus(nextStatus);
        FoodOrder saved = orderRepository.save(order);
        auditLogService.log(actorEmail, UserRole.ADMIN, "ORDER_ADVANCE", "ORDER", String.valueOf(saved.getId()), "Admin moved order to " + saved.getStatus());
        return toResponse(saved, paymentService.getPaymentDetails(saved));
    }

    @Transactional
    public OrderResponse verifyPayment(String reference) {
        FoodOrder order = paymentService.verifyTransaction(reference);
        return toResponse(order, paymentService.getPaymentDetails(order));
    }

    private void authorizeOrderAccess(FoodOrder order, String requesterEmail) {
        AppUser requester = appUserRepository.findByEmailIgnoreCase(requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requester not found"));

        if (requester.getRole() == UserRole.ADMIN) {
            return;
        }

        if (requester.getRole() == UserRole.USER
                && order.getCustomer().getEmail().equalsIgnoreCase(requesterEmail)) {
            return;
        }

        if (requester.getRole() == UserRole.RESTAURANT
                && order.getRestaurant().getOwner() != null
                && order.getRestaurant().getOwner().getEmail().equalsIgnoreCase(requesterEmail)) {
            return;
        }

        if (requester.getRole() == UserRole.DELIVERY
                && ((order.getDeliveryPerson() != null
                && order.getDeliveryPerson().getEmail().equalsIgnoreCase(requesterEmail))
                || (order.getStatus() == OrderStatus.OUT_FOR_DELIVERY
                && order.getDeliveryPerson() == null
                && order.getPaymentStatus() == PaymentStatus.PAID))) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view orders related to your role");
    }

    private OrderResponse toResponse(FoodOrder order, PaymentInitializationResponse payment) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getId(),
                        item.getMenuItem().getId(),
                        item.getMenuItem().getName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getTotalPrice()
                ))
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getGroupReference(),
                order.getRestaurant().getId(),
                order.getRestaurant().getName(),
                order.getRestaurant().getAverageRating(),
                order.getCustomer().getFullName(),
                order.getCustomer().getProfileImageUrl(),
                order.getDeliveryPerson() == null ? null : order.getDeliveryPerson().getFullName(),
                order.getDeliveryPerson() == null ? null : order.getDeliveryPerson().getEmail(),
                order.getDeliveryPerson() == null ? null : order.getDeliveryPerson().getProfileImageUrl(),
                order.getDeliveryPerson() == null ? null : order.getDeliveryPerson().getVehicleType(),
                order.getDeliveryPerson() == null ? null : orderRepository.countByDeliveryPersonId(order.getDeliveryPerson().getId()),
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
                order.getStatus() == OrderStatus.DELIVERED ? order.getUpdatedAt() : null,
                items,
                reviewRepository.existsByOrderId(order.getId()),
                payment
        );
    }
}
