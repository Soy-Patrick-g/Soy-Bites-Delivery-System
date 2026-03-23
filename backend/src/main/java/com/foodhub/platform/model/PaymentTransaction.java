package com.foodhub.platform.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private FoodOrder order;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false, unique = true)
    private String reference;

    private String authorizationUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, precision = 10, scale = 2, columnDefinition = "numeric(10,2) default 0")
    private BigDecimal refundedAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2, columnDefinition = "numeric(10,2) default 0")
    private BigDecimal chargebackAmount = BigDecimal.ZERO;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        applyDefaults();
        createdAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        applyDefaults();
    }

    private void applyDefaults() {
        if (refundedAmount == null) {
            refundedAmount = BigDecimal.ZERO;
        }
        if (chargebackAmount == null) {
            chargebackAmount = BigDecimal.ZERO;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public FoodOrder getOrder() {
        return order;
    }

    public void setOrder(FoodOrder order) {
        this.order = order;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getAuthorizationUrl() {
        return authorizationUrl;
    }

    public void setAuthorizationUrl(String authorizationUrl) {
        this.authorizationUrl = authorizationUrl;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public BigDecimal getRefundedAmount() {
        return refundedAmount;
    }

    public void setRefundedAmount(BigDecimal refundedAmount) {
        this.refundedAmount = refundedAmount;
    }

    public BigDecimal getChargebackAmount() {
        return chargebackAmount;
    }

    public void setChargebackAmount(BigDecimal chargebackAmount) {
        this.chargebackAmount = chargebackAmount;
    }
}
