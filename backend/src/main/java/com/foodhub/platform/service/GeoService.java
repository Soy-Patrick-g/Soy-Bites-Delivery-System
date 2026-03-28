package com.foodhub.platform.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;

@Service
public class GeoService {

    private final DeliverySettingsService deliverySettingsService;

    public GeoService(DeliverySettingsService deliverySettingsService) {
        this.deliverySettingsService = deliverySettingsService;
    }

    public double distanceInKm(double lat1, double lon1, double lat2, double lon2) {
        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    public BigDecimal calculateDeliveryFee(double distanceKm) {
        DeliverySettingsService.DeliverySettingsSnapshot settings = deliverySettingsService.getSnapshot();
        double freeDeliveryUnderKm = settings.freeDeliveryUnderKm();
        if (distanceKm <= freeDeliveryUnderKm) {
            return BigDecimal.ZERO;
        }
        return settings.deliveryBaseFee().add(settings.deliveryFeePerKm().multiply(BigDecimal.valueOf(distanceKm)))
                .setScale(2, RoundingMode.HALF_UP);
    }
}
