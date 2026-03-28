package com.foodhub.platform.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "platform_settings")
public class PlatformSettings {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal deliveryBaseFee = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal deliveryFeePerKm = BigDecimal.ZERO;

    @Column(nullable = false)
    private double freeDeliveryUnderKm = 1.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryCommissionType commissionType = DeliveryCommissionType.FIXED;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal fixedCommissionAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal commissionPercentage = BigDecimal.ZERO;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void onChange() {
        if (id == null) {
            id = SINGLETON_ID;
        }
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getDeliveryBaseFee() {
        return deliveryBaseFee;
    }

    public void setDeliveryBaseFee(BigDecimal deliveryBaseFee) {
        this.deliveryBaseFee = deliveryBaseFee;
    }

    public BigDecimal getDeliveryFeePerKm() {
        return deliveryFeePerKm;
    }

    public void setDeliveryFeePerKm(BigDecimal deliveryFeePerKm) {
        this.deliveryFeePerKm = deliveryFeePerKm;
    }

    public double getFreeDeliveryUnderKm() {
        return freeDeliveryUnderKm;
    }

    public void setFreeDeliveryUnderKm(double freeDeliveryUnderKm) {
        this.freeDeliveryUnderKm = freeDeliveryUnderKm;
    }

    public DeliveryCommissionType getCommissionType() {
        return commissionType;
    }

    public void setCommissionType(DeliveryCommissionType commissionType) {
        this.commissionType = commissionType;
    }

    public BigDecimal getFixedCommissionAmount() {
        return fixedCommissionAmount;
    }

    public void setFixedCommissionAmount(BigDecimal fixedCommissionAmount) {
        this.fixedCommissionAmount = fixedCommissionAmount;
    }

    public BigDecimal getCommissionPercentage() {
        return commissionPercentage;
    }

    public void setCommissionPercentage(BigDecimal commissionPercentage) {
        this.commissionPercentage = commissionPercentage;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
