package com.foodhub.platform.config;

import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.model.MenuItem;
import com.foodhub.platform.model.Restaurant;
import com.foodhub.platform.model.Review;
import com.foodhub.platform.model.UserRole;
import com.foodhub.platform.repository.AppUserRepository;
import com.foodhub.platform.repository.MenuItemRepository;
import com.foodhub.platform.repository.RestaurantRepository;
import com.foodhub.platform.repository.ReviewRepository;
import java.math.BigDecimal;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedDatabase(AppUserRepository appUserRepository,
                                   RestaurantRepository restaurantRepository,
                                   MenuItemRepository menuItemRepository,
                                   ReviewRepository reviewRepository,
                                   PasswordEncoder passwordEncoder) {
        return args -> {
            if (appUserRepository.count() > 0) {
                return;
            }

            AppUser admin = createUser("Platform Admin", "admin@foodhub.dev", UserRole.ADMIN, 6.6732, -1.5654, passwordEncoder);
            AppUser vendor = createUser("Vendor Owner", "vendor@foodhub.dev", UserRole.RESTAURANT, 5.6037, -0.1870, passwordEncoder);
            AppUser customer = createUser("Ama Customer", "user@foodhub.dev", UserRole.USER, 5.5600, -0.2050, passwordEncoder);
            appUserRepository.save(admin);
            appUserRepository.save(vendor);
            appUserRepository.save(customer);

            Restaurant grill = createRestaurant("Savannah Grill", "Charcoal grilled rice bowls, shawarma, and suya-inspired sides.", "African Fusion", "Oxford Street 18", "Accra", 5.5650, -0.1900, vendor, new BigDecimal("4.60"));
            Restaurant sushi = createRestaurant("Harbor Sushi Lab", "Fresh sushi platters and poke bowls for lunch and dinner rushes.", "Japanese", "Marine Drive 5", "Accra", 5.5500, -0.2100, vendor, new BigDecimal("4.80"));
            Restaurant pasta = createRestaurant("Roma Pantry", "Comfort pasta, salads, and tiramisu for family-style dining.", "Italian", "Airport Residential 9", "Accra", 5.6150, -0.1750, vendor, new BigDecimal("4.40"));
            restaurantRepository.save(grill);
            restaurantRepository.save(sushi);
            restaurantRepository.save(pasta);

            menuItemRepository.save(createMenuItem(grill, "Jollof Fire Bowl", "Smoky jollof rice, grilled chicken, plantain, and pepper sauce.", "45.00", false, true));
            menuItemRepository.save(createMenuItem(grill, "Suya Fries", "Crispy fries dusted with suya spice and served with aioli.", "20.00", true, true));
            menuItemRepository.save(createMenuItem(sushi, "Salmon Poke", "Marinated salmon with avocado, cucumber, and sesame rice.", "65.00", false, false));
            menuItemRepository.save(createMenuItem(sushi, "Veggie Maki Set", "Eight-piece cucumber and avocado rolls with miso dip.", "40.00", true, false));
            menuItemRepository.save(createMenuItem(pasta, "Truffle Alfredo", "Fettuccine in creamy truffle sauce with parmesan shards.", "58.00", true, false));
            menuItemRepository.save(createMenuItem(pasta, "Chicken Arrabbiata", "Spicy tomato pasta with grilled chicken and basil.", "52.00", false, true));

            reviewRepository.save(createReview(customer, grill, 5, "Fast delivery, bold flavors, and the plantain was perfect."));
            reviewRepository.save(createReview(customer, sushi, 4, "Very fresh and neatly packed. Would order again."));
            reviewRepository.save(createReview(customer, pasta, 4, "Comforting portions and creamy sauce, slightly longer prep time."));
        };
    }

    private AppUser createUser(String fullName,
                               String email,
                               UserRole role,
                               double latitude,
                               double longitude,
                               PasswordEncoder passwordEncoder) {
        AppUser user = new AppUser();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("Password123!"));
        user.setRole(role);
        user.setLatitude(latitude);
        user.setLongitude(longitude);
        return user;
    }

    private Restaurant createRestaurant(String name,
                                        String description,
                                        String cuisine,
                                        String address,
                                        String city,
                                        double latitude,
                                        double longitude,
                                        AppUser owner,
                                        BigDecimal averageRating) {
        Restaurant restaurant = new Restaurant();
        restaurant.setName(name);
        restaurant.setDescription(description);
        restaurant.setCuisine(cuisine);
        restaurant.setAddress(address);
        restaurant.setCity(city);
        restaurant.setLatitude(latitude);
        restaurant.setLongitude(longitude);
        restaurant.setOwner(owner);
        restaurant.setAverageRating(averageRating);
        restaurant.setActive(true);
        return restaurant;
    }

    private MenuItem createMenuItem(Restaurant restaurant,
                                    String name,
                                    String description,
                                    String price,
                                    boolean vegetarian,
                                    boolean spicy) {
        MenuItem item = new MenuItem();
        item.setRestaurant(restaurant);
        item.setName(name);
        item.setDescription(description);
        item.setPrice(new BigDecimal(price));
        item.setVegetarian(vegetarian);
        item.setSpicy(spicy);
        item.setImageUrl("https://images.unsplash.com/photo-1546069901-ba9599a7e63c");
        return item;
    }

    private Review createReview(AppUser customer, Restaurant restaurant, int rating, String comment) {
        Review review = new Review();
        review.setCustomer(customer);
        review.setRestaurant(restaurant);
        review.setRating(rating);
        review.setComment(comment);
        return review;
    }
}
