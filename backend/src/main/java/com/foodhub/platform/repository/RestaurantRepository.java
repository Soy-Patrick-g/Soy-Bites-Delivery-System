package com.foodhub.platform.repository;

import com.foodhub.platform.model.Restaurant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    List<Restaurant> findByActiveTrue();
    List<Restaurant> findByActiveTrueAndCityIgnoreCase(String city);
    List<Restaurant> findByOwnerId(Long ownerId);
}
