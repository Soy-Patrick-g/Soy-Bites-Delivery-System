package com.foodhub.platform.service;

import com.foodhub.platform.dto.AdminDeliverySettingsResponse;
import com.foodhub.platform.dto.UpdateDeliverySettingsRequest;
import com.foodhub.platform.model.DeliveryCommissionType;
import com.foodhub.platform.model.PlatformSettings;
import com.foodhub.platform.repository.PlatformSettingsRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DeliverySettingsService {

    private final PlatformSettingsRepository platformSettingsRepository;

    @Value("${app.delivery.base-fee}")
    private BigDecimal defaultBaseFee;

    @Value("${app.delivery.fee-per-km}")
    private BigDecimal defaultFeePerKm;

    @Value("${app.delivery.free-delivery-under-km}")
    private double defaultFreeDeliveryUnderKm;

    @Value("${app.delivery.commission.type:DELIVERY_FEE_PERCENTAGE}")
    private String defaultCommissionType;

    @Value("${app.delivery.commission.fixed-amount:25}")
    private BigDecimal defaultFixedCommissionAmount;

    @Value("${app.delivery.commission.percentage:60}")
    private BigDecimal defaultCommissionPercentage;

    public DeliverySettingsService(PlatformSettingsRepository platformSettingsRepository) {
        this.platformSettingsRepository = platformSettingsRepository;
    }

    @Transactional(readOnly = true)
    public DeliverySettingsSnapshot getSnapshot() {
        PlatformSettings settings = getOrCreateSettings();
        return new DeliverySettingsSnapshot(
                settings.getDeliveryBaseFee(),
                settings.getDeliveryFeePerKm(),
                settings.getFreeDeliveryUnderKm(),
                settings.getCommissionType(),
                settings.getFixedCommissionAmount(),
                settings.getCommissionPercentage()
        );
    }

    @Transactional(readOnly = true)
    public AdminDeliverySettingsResponse getAdminSettings() {
        DeliverySettingsSnapshot snapshot = getSnapshot();
        return new AdminDeliverySettingsResponse(
                snapshot.deliveryBaseFee(),
                snapshot.deliveryFeePerKm(),
                snapshot.freeDeliveryUnderKm(),
                snapshot.commissionType().name(),
                snapshot.fixedCommissionAmount(),
                snapshot.commissionPercentage()
        );
    }

    @Transactional
    public AdminDeliverySettingsResponse updateSettings(UpdateDeliverySettingsRequest request) {
        PlatformSettings settings = getOrCreateSettings();
        settings.setDeliveryBaseFee(scaleMoney(request.deliveryBaseFee()));
        settings.setDeliveryFeePerKm(scaleMoney(request.deliveryFeePerKm()));
        settings.setFreeDeliveryUnderKm(request.freeDeliveryUnderKm());
        settings.setCommissionType(parseCommissionType(request.commissionType()));
        settings.setFixedCommissionAmount(scaleMoney(request.fixedCommissionAmount()));
        settings.setCommissionPercentage(request.commissionPercentage().setScale(2, RoundingMode.HALF_UP));
        platformSettingsRepository.save(settings);
        return getAdminSettings();
    }

    private PlatformSettings getOrCreateSettings() {
        return platformSettingsRepository.findById(PlatformSettings.SINGLETON_ID)
                .orElseGet(() -> platformSettingsRepository.save(defaultSettings()));
    }

    private PlatformSettings defaultSettings() {
        PlatformSettings settings = new PlatformSettings();
        settings.setId(PlatformSettings.SINGLETON_ID);
        settings.setDeliveryBaseFee(scaleMoney(defaultBaseFee));
        settings.setDeliveryFeePerKm(scaleMoney(defaultFeePerKm));
        settings.setFreeDeliveryUnderKm(defaultFreeDeliveryUnderKm);
        settings.setCommissionType(parseCommissionType(defaultCommissionType));
        settings.setFixedCommissionAmount(scaleMoney(defaultFixedCommissionAmount));
        settings.setCommissionPercentage(defaultCommissionPercentage.setScale(2, RoundingMode.HALF_UP));
        return settings;
    }

    private DeliveryCommissionType parseCommissionType(String rawValue) {
        try {
            return DeliveryCommissionType.valueOf(rawValue.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported commission type");
        }
    }

    private BigDecimal scaleMoney(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    public record DeliverySettingsSnapshot(
            BigDecimal deliveryBaseFee,
            BigDecimal deliveryFeePerKm,
            double freeDeliveryUnderKm,
            DeliveryCommissionType commissionType,
            BigDecimal fixedCommissionAmount,
            BigDecimal commissionPercentage
    ) {
    }
}
