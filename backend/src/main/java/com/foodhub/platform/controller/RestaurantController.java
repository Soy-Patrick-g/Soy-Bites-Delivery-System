package com.foodhub.platform.controller;

import com.foodhub.platform.dto.RestaurantDetailResponse;
import com.foodhub.platform.dto.RestaurantSummaryResponse;
import com.foodhub.platform.dto.ReviewRequest;
import com.foodhub.platform.dto.ReviewResponse;
import com.foodhub.platform.service.RestaurantService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping
    public List<RestaurantSummaryResponse> listRestaurants(@RequestParam(required = false) Double lat,
                                                           @RequestParam(required = false) Double lng,
                                                           @RequestParam(required = false) String city,
                                                           @RequestParam(required = false, name = "q") String query) {
        return restaurantService.getRestaurants(lat, lng, city, query);
    }

    @GetMapping("/{id}")
    public RestaurantDetailResponse getRestaurant(@PathVariable Long id,
                                                  @RequestParam(required = false) Double lat,
                                                  @RequestParam(required = false) Double lng) {
        return restaurantService.getRestaurant(id, lat, lng);
    }

    @PostMapping("/reviews")
    public ReviewResponse addReview(@Valid @RequestBody ReviewRequest request, Authentication authentication) {
        return restaurantService.addReview(authentication.getName(), request);
    }
}
