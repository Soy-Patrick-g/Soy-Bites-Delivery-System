package com.foodhub.platform.service;

import com.foodhub.platform.dto.AuthResponse;
import com.foodhub.platform.dto.CreateBranchRequest;
import com.foodhub.platform.dto.CreateMenuItemRequest;
import com.foodhub.platform.dto.ImageUploadResponse;
import com.foodhub.platform.dto.MenuItemResponse;
import com.foodhub.platform.dto.OrderItemResponse;
import com.foodhub.platform.dto.OrderResponse;
import com.foodhub.platform.dto.OwnerDashboardResponse;
import com.foodhub.platform.dto.PaymentInitializationResponse;
import com.foodhub.platform.dto.RestaurantPreviewItemResponse;
import com.foodhub.platform.dto.RestaurantOwnerRegisterRequest;
import com.foodhub.platform.dto.RestaurantSummaryResponse;
import com.foodhub.platform.dto.UpdateMenuItemRequest;
import com.foodhub.platform.dto.UpdateMenuItemAvailabilityRequest;
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
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OwnerPortalService {

    private final AppUserRepository appUserRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final UserSessionService userSessionService;
    private final AuditLogService auditLogService;
    private final PaymentService paymentService;
    private final GeoService geoService;
    private final CloudinaryImageService cloudinaryImageService;

    public OwnerPortalService(AppUserRepository appUserRepository,
                              MenuItemRepository menuItemRepository,
                              RestaurantRepository restaurantRepository,
                              OrderRepository orderRepository,
                              PasswordEncoder passwordEncoder,
                              JwtService jwtService,
                              CustomUserDetailsService userDetailsService,
                              UserSessionService userSessionService,
                              AuditLogService auditLogService,
                              PaymentService paymentService,
                              GeoService geoService,
                              CloudinaryImageService cloudinaryImageService) {
        this.appUserRepository = appUserRepository;
        this.menuItemRepository = menuItemRepository;
        this.restaurantRepository = restaurantRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.userSessionService = userSessionService;
        this.auditLogService = auditLogService;
        this.paymentService = paymentService;
        this.geoService = geoService;
        this.cloudinaryImageService = cloudinaryImageService;
    }

    @Transactional
    public AuthResponse registerOwner(RestaurantOwnerRegisterRequest request) {
        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        AppUser owner = new AppUser();
        owner.setFullName(request.fullName());
        owner.setEmail(request.email());
        owner.setPassword(passwordEncoder.encode(request.password()));
        owner.setRole(UserRole.RESTAURANT);
        owner.setLatitude(request.latitude());
        owner.setLongitude(request.longitude());
        appUserRepository.save(owner);

        Restaurant restaurant = new Restaurant();
        restaurant.setName(request.restaurantName());
        restaurant.setBrandName(request.restaurantName());
        restaurant.setDescription(request.description());
        restaurant.setCuisine(request.cuisine());
        restaurant.setAddress(request.address());
        restaurant.setCity(request.city());
        restaurant.setLatitude(request.latitude());
        restaurant.setLongitude(request.longitude());
        restaurant.setOwner(owner);
        restaurant.setActive(true);
        restaurantRepository.save(restaurant);

        var session = userSessionService.createSession(owner, jwtService.calculateExpirationInstant());
        String token = jwtService.generateToken(
                userDetailsService.loadUserByUsername(owner.getEmail()),
                owner.getRole().name(),
                session.getSessionId()
        );
        auditLogService.log(owner.getEmail(), owner.getRole(), "OWNER_REGISTER", "RESTAURANT", String.valueOf(restaurant.getId()), "Restaurant owner registered with first branch");
        return new AuthResponse(token, owner.getFullName(), owner.getEmail(), owner.getRole(), session.getExpiresAt());
    }

    @Transactional
    public RestaurantSummaryResponse createBranch(String ownerEmail, CreateBranchRequest request) {
        AppUser owner = appUserRepository.findByEmailIgnoreCase(ownerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));

        Restaurant branch = new Restaurant();
        branch.setName(request.branchName());
        branch.setBrandName(request.brandName());
        branch.setDescription(request.description());
        branch.setCuisine(request.cuisine());
        branch.setAddress(request.address());
        branch.setCity(request.city());
        branch.setLatitude(request.latitude());
        branch.setLongitude(request.longitude());
        branch.setOwner(owner);
        branch.setActive(true);

        Restaurant saved = restaurantRepository.save(branch);
        auditLogService.log(owner.getEmail(), owner.getRole(), "BRANCH_CREATE", "RESTAURANT", String.valueOf(saved.getId()), saved.getName());
        return toRestaurantSummary(saved);
    }

    @Transactional(readOnly = true)
    public OwnerDashboardResponse getDashboard(String ownerEmail) {
        AppUser owner = appUserRepository.findByEmailIgnoreCase(ownerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));

        List<RestaurantSummaryResponse> restaurants = restaurantRepository.findByOwnerId(owner.getId()).stream()
                .map(this::toRestaurantSummary)
                .toList();

        List<OrderResponse> orders = orderRepository.findByRestaurantOwnerIdOrderByCreatedAtDesc(owner.getId()).stream()
                .map(this::toOrderResponse)
                .toList();

        var allocatedRevenue = orderRepository.findByRestaurantOwnerIdOrderByCreatedAtDesc(owner.getId()).stream()
                .filter(order -> order.getPaymentStatus() == PaymentStatus.PAID)
                .map(FoodOrder::getSubtotal)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        return new OwnerDashboardResponse(owner.getFullName(), owner.getEmail(), allocatedRevenue, restaurants, orders);
    }

    @Transactional
    public OrderResponse advanceOrder(String ownerEmail, Long orderId) {
        AppUser owner = appUserRepository.findByEmailIgnoreCase(ownerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));
        FoodOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getRestaurant().getOwner() == null
                || !order.getRestaurant().getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own restaurant orders");
        }

        OrderStatus nextStatus = switch (order.getStatus()) {
            case RECEIVED -> OrderStatus.PREPARING;
            case PREPARING -> OrderStatus.OUT_FOR_DELIVERY;
            case OUT_FOR_DELIVERY, DELIVERED ->
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Restaurant owners can only move orders up to out for delivery");
        };
        order.setStatus(nextStatus);
        FoodOrder saved = orderRepository.save(order);
        auditLogService.log(ownerEmail, UserRole.RESTAURANT, "ORDER_ADVANCE", "ORDER", String.valueOf(saved.getId()), "Owner moved order to " + saved.getStatus());
        return toOrderResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<MenuItemResponse> getRestaurantMenu(String ownerEmail, Long restaurantId) {
        Restaurant restaurant = findOwnedRestaurant(ownerEmail, restaurantId);
        return menuItemRepository.findByRestaurantIdOrderByNameAsc(restaurant.getId()).stream()
                .map(this::toMenuItemResponse)
                .toList();
    }

    @Transactional
    public MenuItemResponse createMenuItem(String ownerEmail, Long restaurantId, CreateMenuItemRequest request) {
        Restaurant restaurant = findOwnedRestaurant(ownerEmail, restaurantId);
        List<Restaurant> targetRestaurants = request.availableInAllBranches()
                ? getRestaurantsInBrand(restaurant)
                : List.of(restaurant);

        MenuItem createdForSelectedRestaurant = null;
        for (Restaurant targetRestaurant : targetRestaurants) {
            MenuItem item = new MenuItem();
            applyMenuItemFields(item, request.name(), request.description(), request.price(), request.imageUrl(),
                    request.vegetarian(), request.spicy(), request.available());
            item.setRestaurant(targetRestaurant);
            MenuItem saved = menuItemRepository.save(item);
            if (targetRestaurant.getId().equals(restaurant.getId())) {
                createdForSelectedRestaurant = saved;
            }
        }

        if (createdForSelectedRestaurant == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Menu item was not created");
        }

        auditLogService.log(ownerEmail, UserRole.RESTAURANT, "MENU_ITEM_CREATE", "MENU_ITEM", String.valueOf(createdForSelectedRestaurant.getId()), createdForSelectedRestaurant.getName());
        return toMenuItemResponse(createdForSelectedRestaurant);
    }

    @Transactional
    public MenuItemResponse updateMenuItem(String ownerEmail,
                                           Long restaurantId,
                                           Long menuItemId,
                                           UpdateMenuItemRequest request) {
        Restaurant restaurant = findOwnedRestaurant(ownerEmail, restaurantId);
        MenuItem item = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));

        if (!item.getRestaurant().getId().equals(restaurant.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage menu items for your own restaurant");
        }

        String originalName = item.getName();
        applyMenuItemFields(item, request.name(), request.description(), request.price(), request.imageUrl(),
                request.vegetarian(), request.spicy(), request.available());
        MenuItem saved = menuItemRepository.save(item);

        if (request.applyToAllBranches()) {
            String originalNameNormalized = originalName.trim().toLowerCase(Locale.ROOT);
            for (Restaurant sibling : getRestaurantsInBrand(restaurant)) {
                if (sibling.getId().equals(restaurant.getId())) {
                    continue;
                }

                menuItemRepository.findByRestaurantIdOrderByNameAsc(sibling.getId()).stream()
                        .filter(existing -> existing.getName().trim().toLowerCase(Locale.ROOT).equals(originalNameNormalized))
                        .forEach(existing -> {
                            applyMenuItemFields(existing, request.name(), request.description(), request.price(),
                                    request.imageUrl(), request.vegetarian(), request.spicy(), request.available());
                            menuItemRepository.save(existing);
                        });
            }
        }

        auditLogService.log(ownerEmail, UserRole.RESTAURANT, "MENU_ITEM_UPDATE", "MENU_ITEM", String.valueOf(saved.getId()), saved.getName());
        return toMenuItemResponse(saved);
    }

    @Transactional
    public MenuItemResponse updateMenuItemAvailability(String ownerEmail,
                                                       Long restaurantId,
                                                       Long menuItemId,
                                                       UpdateMenuItemAvailabilityRequest request) {
        Restaurant restaurant = findOwnedRestaurant(ownerEmail, restaurantId);
        MenuItem item = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Menu item not found"));

        if (!item.getRestaurant().getId().equals(restaurant.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage menu items for your own restaurant");
        }

        item.setAvailable(request.available());
        MenuItem saved = menuItemRepository.save(item);
        auditLogService.log(ownerEmail, UserRole.RESTAURANT, "MENU_ITEM_AVAILABILITY_UPDATE", "MENU_ITEM", String.valueOf(saved.getId()), "Available=" + saved.isAvailable());
        return toMenuItemResponse(saved);
    }

    @Transactional
    public ImageUploadResponse uploadMenuImage(String ownerEmail, MultipartFile file) {
        AppUser owner = appUserRepository.findByEmailIgnoreCase(ownerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));

        ImageUploadResponse uploaded = cloudinaryImageService.uploadMenuImage(file);
        auditLogService.log(
                owner.getEmail(),
                owner.getRole(),
                "MENU_IMAGE_UPLOAD",
                "ASSET",
                uploaded.publicId(),
                uploaded.originalFilename()
        );
        return uploaded;
    }

    private RestaurantSummaryResponse toRestaurantSummary(Restaurant restaurant) {
        Double distanceKm = null;
        if (restaurant.getOwner() != null
                && restaurant.getOwner().getLatitude() != null
                && restaurant.getOwner().getLongitude() != null) {
            distanceKm = geoService.distanceInKm(
                    restaurant.getOwner().getLatitude(),
                    restaurant.getOwner().getLongitude(),
                    restaurant.getLatitude(),
                    restaurant.getLongitude()
            );
        }

        return new RestaurantSummaryResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getBrandName(),
                restaurant.getDescription(),
                restaurant.getCuisine(),
                restaurant.getCity(),
                restaurant.getAddress(),
                restaurant.isVerified(),
                restaurant.getLatitude(),
                restaurant.getLongitude(),
                restaurant.getAverageRating(),
                distanceKm,
                distanceKm == null ? null : geoService.calculateDeliveryFee(distanceKm),
                menuItemRepository.findTop3ByRestaurantIdAndAvailableTrueOrderByIdDesc(restaurant.getId()).stream()
                        .map(item -> new RestaurantPreviewItemResponse(
                                item.getId(),
                                item.getName(),
                                item.getPrice(),
                                item.getImageUrl()
                        ))
                        .toList()
        );
    }

    private Restaurant findOwnedRestaurant(String ownerEmail, Long restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Restaurant not found"));

        if (restaurant.getOwner() == null || !restaurant.getOwner().getEmail().equalsIgnoreCase(ownerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own restaurant");
        }

        return restaurant;
    }

    private List<Restaurant> getRestaurantsInBrand(Restaurant restaurant) {
        if (restaurant.getOwner() == null || restaurant.getBrandName() == null || restaurant.getBrandName().isBlank()) {
            return List.of(restaurant);
        }

        List<Restaurant> restaurants = restaurantRepository.findByOwnerIdAndBrandNameIgnoreCase(
                restaurant.getOwner().getId(),
                restaurant.getBrandName()
        );
        return restaurants.isEmpty() ? List.of(restaurant) : restaurants;
    }

    private void applyMenuItemFields(MenuItem item,
                                     String name,
                                     String description,
                                     java.math.BigDecimal price,
                                     String imageUrl,
                                     boolean vegetarian,
                                     boolean spicy,
                                     boolean available) {
        item.setName(name);
        item.setDescription(description);
        item.setPrice(price);
        item.setImageUrl(blankToNull(imageUrl));
        item.setVegetarian(vegetarian);
        item.setSpicy(spicy);
        item.setAvailable(available);
    }

    private MenuItemResponse toMenuItemResponse(MenuItem item) {
        return new MenuItemResponse(
                item.getId(),
                item.getName(),
                item.getDescription(),
                item.getPrice(),
                item.getImageUrl(),
                item.isAvailable(),
                item.isVegetarian(),
                item.isSpicy()
        );
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

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
