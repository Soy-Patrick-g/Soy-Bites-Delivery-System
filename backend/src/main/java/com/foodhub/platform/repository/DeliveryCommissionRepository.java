package com.foodhub.platform.repository;

import com.foodhub.platform.model.DeliveryCommission;
import com.foodhub.platform.model.DeliveryCommissionPaymentStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryCommissionRepository extends JpaRepository<DeliveryCommission, Long> {

    boolean existsByOrderId(Long orderId);

    @EntityGraph(attributePaths = {"deliveryPerson", "order", "order.restaurant", "order.customer"})
    List<DeliveryCommission> findByDeliveryPersonIdOrderByCreatedAtDesc(Long deliveryPersonId);

    @EntityGraph(attributePaths = {"deliveryPerson", "order", "order.restaurant", "order.customer"})
    List<DeliveryCommission> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"deliveryPerson", "order", "order.restaurant", "order.customer"})
    List<DeliveryCommission> findByPaymentStatusOrderByCreatedAtDesc(DeliveryCommissionPaymentStatus paymentStatus);

    @EntityGraph(attributePaths = {"deliveryPerson", "order", "order.restaurant", "order.customer"})
    Optional<DeliveryCommission> findById(Long id);
}
