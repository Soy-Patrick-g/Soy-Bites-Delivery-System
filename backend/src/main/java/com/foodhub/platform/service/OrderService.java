package com.foodhub.platform.service;

import com.foodhub.platform.dto.OrderItemResponse;
import com.foodhub.platform.dto.OrderResponse;
import com.foodhub.platform.dto.PaymentInitializationResponse;
import com.foodhub.platform.dto.PlaceOrderRequest;
import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.model.FoodOrder;
import com.foodhub.platform.model.MenuItem;
import com.foodhub.platform.model.OrderItem;
import com.foodhub.platform.model.OrderStatus;
import com.foodhub.platform.model.Restaurant;
import com.foodhub.platform.repository.AppUserRepository;
import com.foodhub.platform.repository.MenuItemRepository;
import com.foodhub.platform.repository.OrderRepository;
import com.foodhub.platform.repository.RestaurantRepository;
import java.math.BigDecimal;
import java.util.List;
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
    private final GeoService geoService;
    private final PaymentService paymentService;

    public OrderService(AppUserRepository appUserRepository,
                        RestaurantRepository restaurantRepository,
                        MenuItemRepository menuItemRepository,
                        OrderRepository orderRepository,
                        GeoService geoService,
                        PaymentService paymentService) {
        this.appUserRepository = appUserRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.orderRepository = orderRepository;
        this.geoService = geoService;
        this.paymentService = paymentService;
    }

    @Transactional
    public OrderResponse placeOrder(PlaceOrderRequest request) {
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

        return toResponse(orderRepository.save(saved), payment);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long id) {
        FoodOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        return toResponse(order, paymentService.getPaymentDetails(order));
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

    @Transactional
    public OrderResponse advanceOrder(Long orderId) {
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
        return toResponse(saved, paymentService.getPaymentDetails(saved));
    }

    @Transactional
    public OrderResponse verifyPayment(String reference) {
        FoodOrder order = paymentService.verifyTransaction(reference);
        return toResponse(order, paymentService.getPaymentDetails(order));
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
                order.getRestaurant().getName(),
                order.getCustomer().getFullName(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getPaymentReference(),
                order.getDeliveryAddress(),
                order.getDistanceKm(),
                order.getSubtotal(),
                order.getDeliveryFee(),
                order.getTotal(),
                order.getCreatedAt(),
                items,
                payment
        );
    }
}
