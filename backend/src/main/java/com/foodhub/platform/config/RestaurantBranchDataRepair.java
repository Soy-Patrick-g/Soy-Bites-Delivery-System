package com.foodhub.platform.config;

import com.foodhub.platform.model.MenuItem;
import com.foodhub.platform.model.Restaurant;
import com.foodhub.platform.repository.MenuItemRepository;
import com.foodhub.platform.repository.RestaurantRepository;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RestaurantBranchDataRepair {

    private static final Logger log = LoggerFactory.getLogger(RestaurantBranchDataRepair.class);

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    public RestaurantBranchDataRepair(RestaurantRepository restaurantRepository,
                                      MenuItemRepository menuItemRepository) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void repairRestaurantBranches() {
        List<Restaurant> restaurants = restaurantRepository.findAll();
        normalizeBrandNames(restaurants);
        backfillMissingBranchMenus(restaurants);
    }

    private void normalizeBrandNames(List<Restaurant> restaurants) {
        List<Restaurant> dirtyRestaurants = restaurants.stream()
                .filter(restaurant -> !Objects.equals(restaurant.getBrandName(), trimToNull(restaurant.getBrandName())))
                .peek(restaurant -> restaurant.setBrandName(trimToNull(restaurant.getBrandName())))
                .toList();

        if (!dirtyRestaurants.isEmpty()) {
            restaurantRepository.saveAll(dirtyRestaurants);
            log.info("Normalized brand names for {} restaurant branches", dirtyRestaurants.size());
        }
    }

    private void backfillMissingBranchMenus(List<Restaurant> restaurants) {
        Map<String, List<Restaurant>> groups = restaurants.stream()
                .filter(restaurant -> restaurant.getOwner() != null)
                .map(restaurant -> Map.entry(groupKeyFor(restaurant), restaurant))
                .filter(entry -> entry.getKey() != null)
                .collect(Collectors.groupingBy(
                        Map.Entry::getKey,
                        LinkedHashMap::new,
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())
                ));

        for (List<Restaurant> group : groups.values()) {
            if (group.size() < 2) {
                continue;
            }

            Restaurant sourceRestaurant = group.stream()
                    .max(Comparator.comparingInt(restaurant ->
                            menuItemRepository.findByRestaurantIdOrderByNameAsc(restaurant.getId()).size()))
                    .orElse(null);

            if (sourceRestaurant == null) {
                continue;
            }

            List<MenuItem> sourceMenu = menuItemRepository.findByRestaurantIdOrderByNameAsc(sourceRestaurant.getId());
            if (sourceMenu.isEmpty()) {
                continue;
            }

            for (Restaurant targetRestaurant : group) {
                if (targetRestaurant.getId().equals(sourceRestaurant.getId())) {
                    continue;
                }

                List<MenuItem> targetMenu = menuItemRepository.findByRestaurantIdOrderByNameAsc(targetRestaurant.getId());
                Set<String> existingNames = targetMenu.stream()
                        .map(MenuItem::getName)
                        .map(this::normalizeMenuName)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());

                List<MenuItem> missingItems = sourceMenu.stream()
                        .filter(item -> {
                            String normalizedName = normalizeMenuName(item.getName());
                            return normalizedName != null && !existingNames.contains(normalizedName);
                        })
                        .map(item -> cloneForRestaurant(item, targetRestaurant))
                        .toList();

                if (!missingItems.isEmpty()) {
                    menuItemRepository.saveAll(missingItems);
                    log.info("Backfilled {} menu items from {} to {}",
                            missingItems.size(),
                            sourceRestaurant.getName(),
                            targetRestaurant.getName());
                }
            }
        }
    }

    private MenuItem cloneForRestaurant(MenuItem source, Restaurant targetRestaurant) {
        MenuItem clone = new MenuItem();
        clone.setRestaurant(targetRestaurant);
        clone.setName(source.getName());
        clone.setDescription(source.getDescription());
        clone.setPrice(source.getPrice());
        clone.setImageUrl(source.getImageUrl());
        clone.setAvailable(source.isAvailable());
        clone.setVegetarian(source.isVegetarian());
        clone.setSpicy(source.isSpicy());
        return clone;
    }

    private String groupKeyFor(Restaurant restaurant) {
        String brandName = trimToNull(restaurant.getBrandName());
        if (restaurant.getOwner() == null || brandName == null) {
            return null;
        }
        return restaurant.getOwner().getId() + "::" + brandName.toLowerCase(Locale.ROOT);
    }

    private String normalizeMenuName(String name) {
        String normalized = trimToNull(name);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
