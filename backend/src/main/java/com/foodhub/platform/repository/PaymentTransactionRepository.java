package com.foodhub.platform.repository;

import com.foodhub.platform.model.PaymentTransaction;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    @Override
    @EntityGraph(attributePaths = {"order", "order.customer", "order.restaurant", "order.restaurant.owner"})
    List<PaymentTransaction> findAll();

    @EntityGraph(attributePaths = {"order", "order.customer", "order.restaurant", "order.restaurant.owner"})
    Optional<PaymentTransaction> findByReference(String reference);

    @EntityGraph(attributePaths = {"order", "order.customer", "order.restaurant", "order.restaurant.owner"})
    List<PaymentTransaction> findByCreatedAtAfter(Instant instant);
}
