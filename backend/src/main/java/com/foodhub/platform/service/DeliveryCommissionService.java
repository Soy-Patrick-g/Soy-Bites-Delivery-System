package com.foodhub.platform.service;

import com.foodhub.platform.dto.AdminDeliveryCommissionResponse;
import com.foodhub.platform.dto.AdminDeliveryPersonnelEarningsResponse;
import com.foodhub.platform.dto.DeliveryCommissionResponse;
import com.foodhub.platform.dto.DeliveryEarningsSummaryResponse;
import com.foodhub.platform.dto.UpdateDeliveryCommissionStatusRequest;
import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.model.DeliveryCommission;
import com.foodhub.platform.model.DeliveryCommissionPaymentStatus;
import com.foodhub.platform.model.DeliveryCommissionType;
import com.foodhub.platform.model.FoodOrder;
import com.foodhub.platform.model.UserRole;
import com.foodhub.platform.repository.AppUserRepository;
import com.foodhub.platform.repository.DeliveryCommissionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DeliveryCommissionService {

    private final DeliveryCommissionRepository deliveryCommissionRepository;
    private final AppUserRepository appUserRepository;
    private final DeliverySettingsService deliverySettingsService;
    private final AdminRealtimeService adminRealtimeService;
    private final AuditLogService auditLogService;

    public DeliveryCommissionService(DeliveryCommissionRepository deliveryCommissionRepository,
                                     AppUserRepository appUserRepository,
                                     DeliverySettingsService deliverySettingsService,
                                     AdminRealtimeService adminRealtimeService,
                                     AuditLogService auditLogService) {
        this.deliveryCommissionRepository = deliveryCommissionRepository;
        this.appUserRepository = appUserRepository;
        this.deliverySettingsService = deliverySettingsService;
        this.adminRealtimeService = adminRealtimeService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public void recordCompletedDeliveries(List<FoodOrder> deliveredOrders) {
        DeliverySettingsService.DeliverySettingsSnapshot settings = deliverySettingsService.getSnapshot();

        for (FoodOrder order : deliveredOrders) {
            if (order.getDeliveryPerson() == null || deliveryCommissionRepository.existsByOrderId(order.getId())) {
                continue;
            }

            BigDecimal commissionAmount = calculateCommission(order.getDeliveryFee(), settings);
            DeliveryCommission commission = new DeliveryCommission();
            commission.setDeliveryPerson(order.getDeliveryPerson());
            commission.setOrder(order);
            commission.setDeliveryFee(scaleMoney(order.getDeliveryFee()));
            commission.setCommissionAmount(commissionAmount);
            commission.setPaymentStatus(DeliveryCommissionPaymentStatus.PENDING);
            DeliveryCommission saved = deliveryCommissionRepository.save(commission);

            AppUser driver = order.getDeliveryPerson();
            driver.setDeliveryEarningsTotal(scaleMoney(driver.getDeliveryEarningsTotal().add(commissionAmount)));
            appUserRepository.save(driver);

            adminRealtimeService.publish("commission_calculated", toAdminCommissionResponse(saved));
        }
    }

    @Transactional(readOnly = true)
    public DeliveryEarningsSummaryResponse getDriverSummary(Long driverId) {
        List<DeliveryCommission> commissions = deliveryCommissionRepository.findByDeliveryPersonIdOrderByCreatedAtDesc(driverId);
        BigDecimal total = sum(commissions.stream().map(DeliveryCommission::getCommissionAmount).toList());
        BigDecimal pending = sum(commissions.stream()
                .filter(commission -> commission.getPaymentStatus() == DeliveryCommissionPaymentStatus.PENDING)
                .map(DeliveryCommission::getCommissionAmount)
                .toList());
        BigDecimal paid = sum(commissions.stream()
                .filter(commission -> commission.getPaymentStatus() == DeliveryCommissionPaymentStatus.PAID)
                .map(DeliveryCommission::getCommissionAmount)
                .toList());
        return new DeliveryEarningsSummaryResponse(total, pending, paid, commissions.size());
    }

    @Transactional(readOnly = true)
    public List<DeliveryCommissionResponse> getDriverCommissions(Long driverId) {
        return deliveryCommissionRepository.findByDeliveryPersonIdOrderByCreatedAtDesc(driverId).stream()
                .map(this::toDriverCommissionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminDeliveryCommissionResponse> getAllCommissionRecords() {
        return deliveryCommissionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toAdminCommissionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminDeliveryPersonnelEarningsResponse> getPersonnelEarnings() {
        return appUserRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.DELIVERY)
                .map(this::toPersonnelEarningsResponse)
                .sorted(Comparator.comparing(AdminDeliveryPersonnelEarningsResponse::totalEarnings).reversed())
                .toList();
    }

    @Transactional
    public AdminDeliveryCommissionResponse updateCommissionPaymentStatus(Long commissionId,
                                                                        UpdateDeliveryCommissionStatusRequest request,
                                                                        String adminEmail) {
        DeliveryCommission commission = deliveryCommissionRepository.findById(commissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commission record not found"));

        DeliveryCommissionPaymentStatus nextStatus = parsePaymentStatus(request.paymentStatus());
        DeliveryCommissionPaymentStatus previousStatus = commission.getPaymentStatus();
        commission.setPaymentStatus(nextStatus);
        commission.setPaidAt(nextStatus == DeliveryCommissionPaymentStatus.PAID ? Instant.now() : null);
        DeliveryCommission saved = deliveryCommissionRepository.save(commission);

        AppUser deliveryPerson = saved.getDeliveryPerson();
        if (previousStatus != nextStatus) {
            if (nextStatus == DeliveryCommissionPaymentStatus.PAID) {
                deliveryPerson.setAccountBalance(scaleMoney(deliveryPerson.getAccountBalance().add(saved.getCommissionAmount())));
                appUserRepository.save(deliveryPerson);
            } else if (previousStatus == DeliveryCommissionPaymentStatus.PAID) {
                BigDecimal nextBalance = deliveryPerson.getAccountBalance().subtract(saved.getCommissionAmount());
                if (nextBalance.compareTo(BigDecimal.ZERO) < 0) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "This commission has already been withdrawn and cannot be marked pending again");
                }
                deliveryPerson.setAccountBalance(scaleMoney(nextBalance));
                appUserRepository.save(deliveryPerson);
            }
        }

        auditLogService.log(adminEmail, UserRole.ADMIN, "ADMIN_DELIVERY_COMMISSION_STATUS", "DELIVERY_COMMISSION", String.valueOf(saved.getId()), nextStatus.name());
        AdminDeliveryCommissionResponse response = toAdminCommissionResponse(saved);
        adminRealtimeService.publish("personnel_payment_updated", response);
        return response;
    }

    @Transactional(readOnly = true)
    public BigDecimal getPendingCommissionTotal() {
        return sum(deliveryCommissionRepository.findByPaymentStatusOrderByCreatedAtDesc(DeliveryCommissionPaymentStatus.PENDING)
                .stream()
                .map(DeliveryCommission::getCommissionAmount)
                .toList());
    }

    @Transactional(readOnly = true)
    public BigDecimal getPaidCommissionTotal() {
        return sum(deliveryCommissionRepository.findByPaymentStatusOrderByCreatedAtDesc(DeliveryCommissionPaymentStatus.PAID)
                .stream()
                .map(DeliveryCommission::getCommissionAmount)
                .toList());
    }

    @Transactional(readOnly = true)
    public long getCompletedDeliveriesCount() {
        return deliveryCommissionRepository.count();
    }

    private AdminDeliveryPersonnelEarningsResponse toPersonnelEarningsResponse(AppUser user) {
        DeliveryEarningsSummaryResponse summary = getDriverSummary(user.getId());
        return new AdminDeliveryPersonnelEarningsResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                summary.totalEarnings(),
                summary.pendingEarnings(),
                summary.paidEarnings(),
                summary.completedDeliveries()
        );
    }

    private DeliveryCommissionResponse toDriverCommissionResponse(DeliveryCommission commission) {
        return new DeliveryCommissionResponse(
                commission.getId(),
                commission.getOrder().getId(),
                commission.getDeliveryFee(),
                commission.getCommissionAmount(),
                commission.getPaymentStatus().name(),
                commission.getCreatedAt(),
                commission.getPaidAt()
        );
    }

    private AdminDeliveryCommissionResponse toAdminCommissionResponse(DeliveryCommission commission) {
        return new AdminDeliveryCommissionResponse(
                commission.getId(),
                commission.getDeliveryPerson().getId(),
                commission.getDeliveryPerson().getFullName(),
                commission.getDeliveryPerson().getEmail(),
                commission.getOrder().getId(),
                commission.getOrder().getGroupReference(),
                commission.getDeliveryFee(),
                commission.getCommissionAmount(),
                commission.getPaymentStatus().name(),
                commission.getCreatedAt(),
                commission.getPaidAt()
        );
    }

    private BigDecimal calculateCommission(BigDecimal deliveryFee, DeliverySettingsService.DeliverySettingsSnapshot settings) {
        BigDecimal normalizedDeliveryFee = scaleMoney(deliveryFee == null ? BigDecimal.ZERO : deliveryFee);
        if (settings.commissionType() == DeliveryCommissionType.FIXED) {
            return scaleMoney(settings.fixedCommissionAmount());
        }

        BigDecimal ratio = settings.commissionPercentage().divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
        return scaleMoney(normalizedDeliveryFee.multiply(ratio));
    }

    private DeliveryCommissionPaymentStatus parsePaymentStatus(String rawValue) {
        try {
            return DeliveryCommissionPaymentStatus.valueOf(rawValue.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported commission payment status");
        }
    }

    private BigDecimal sum(List<BigDecimal> amounts) {
        return amounts.stream()
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal scaleMoney(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }
}
