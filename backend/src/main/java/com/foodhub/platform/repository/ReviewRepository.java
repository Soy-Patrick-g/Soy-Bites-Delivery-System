package com.foodhub.platform.repository;

import com.foodhub.platform.model.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);
    long countByRestaurantId(Long restaurantId);
}

