package com.foodhub.platform.repository;

import com.foodhub.platform.model.FoodOrder;
import com.foodhub.platform.model.OrderStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<FoodOrder, Long> {

    @EntityGraph(attributePaths = {"items", "items.menuItem", "restaurant", "customer", "deliveryPerson"})
    List<FoodOrder> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    @EntityGraph(attributePaths = {"items", "items.menuItem", "restaurant", "customer", "deliveryPerson"})
    List<FoodOrder> findByRestaurantOwnerIdOrderByCreatedAtDesc(Long ownerId);

    @EntityGraph(attributePaths = {"items", "items.menuItem", "restaurant", "customer", "deliveryPerson"})
    List<FoodOrder> findByDeliveryPersonIdOrderByCreatedAtDesc(Long deliveryPersonId);

    @EntityGraph(attributePaths = {"items", "items.menuItem", "restaurant", "customer", "deliveryPerson"})
    List<FoodOrder> findByStatusAndDeliveryPersonIsNullOrderByCreatedAtAsc(OrderStatus status);

    @EntityGraph(attributePaths = {"items", "items.menuItem", "restaurant", "customer", "deliveryPerson"})
    List<FoodOrder> findByGroupReferenceOrderByCreatedAtAsc(String groupReference);

    @EntityGraph(attributePaths = {"items", "items.menuItem", "restaurant", "customer", "deliveryPerson"})
    Optional<FoodOrder> findById(Long id);
}
