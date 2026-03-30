package com.foodhub.platform.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "app_users")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    private String profileImageUrl;

    private String vehicleType;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean active = true;

    private Double latitude;

    private Double longitude;

    @Column(nullable = false, precision = 10, scale = 2, columnDefinition = "numeric(10,2) default 0")
    private BigDecimal accountBalance = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2, columnDefinition = "numeric(10,2) default 0")
    private BigDecimal deliveryEarningsTotal = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(255) default 'UNVERIFIED'")
    private KycStatus kycStatus = KycStatus.UNVERIFIED;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean riskFlagged = false;

    private String alertNote;

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
        if (accountBalance == null) {
            accountBalance = BigDecimal.ZERO;
        }
        if (deliveryEarningsTotal == null) {
            deliveryEarningsTotal = BigDecimal.ZERO;
        }
        if (kycStatus == null) {
            kycStatus = KycStatus.UNVERIFIED;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public BigDecimal getAccountBalance() {
        return accountBalance;
    }

    public void setAccountBalance(BigDecimal accountBalance) {
        this.accountBalance = accountBalance;
    }

    public BigDecimal getDeliveryEarningsTotal() {
        return deliveryEarningsTotal;
    }

    public void setDeliveryEarningsTotal(BigDecimal deliveryEarningsTotal) {
        this.deliveryEarningsTotal = deliveryEarningsTotal;
    }

    public KycStatus getKycStatus() {
        return kycStatus;
    }

    public void setKycStatus(KycStatus kycStatus) {
        this.kycStatus = kycStatus;
    }

    public boolean isRiskFlagged() {
        return riskFlagged;
    }

    public void setRiskFlagged(boolean riskFlagged) {
        this.riskFlagged = riskFlagged;
    }

    public String getAlertNote() {
        return alertNote;
    }

    public void setAlertNote(String alertNote) {
        this.alertNote = alertNote;
    }
}
