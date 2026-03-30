package com.foodhub.platform.repository;

import com.foodhub.platform.model.MenuItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByRestaurantIdAndAvailableTrue(Long restaurantId);
    List<MenuItem> findByRestaurantIdAndAvailableTrueOrderByNameAsc(Long restaurantId);
    List<MenuItem> findTop3ByRestaurantIdAndAvailableTrueOrderByIdDesc(Long restaurantId);
    List<MenuItem> findByRestaurantIdOrderByNameAsc(Long restaurantId);
}
