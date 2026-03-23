package com.foodhub.platform.service;

import com.foodhub.platform.dto.AdminAuditLogResponse;
import com.foodhub.platform.dto.AdminDashboardResponse;
import com.foodhub.platform.dto.AdminSessionResponse;
import com.foodhub.platform.dto.AdminTransactionResponse;
import com.foodhub.platform.dto.AdminTrendPointResponse;
import com.foodhub.platform.dto.AdminUserInsightResponse;
import com.foodhub.platform.dto.AdminUserTransactionPreviewResponse;
import com.foodhub.platform.dto.RestaurantSummaryResponse;
import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.model.FoodOrder;
import com.foodhub.platform.model.PaymentStatus;
import com.foodhub.platform.model.PaymentTransaction;
import com.foodhub.platform.model.UserSession;
import com.foodhub.platform.repository.AppUserRepository;
import com.foodhub.platform.repository.AuditLogRepository;
import com.foodhub.platform.repository.OrderRepository;
import com.foodhub.platform.repository.PaymentTransactionRepository;
import com.foodhub.platform.repository.RestaurantRepository;
import com.foodhub.platform.repository.ReviewRepository;
import com.foodhub.platform.repository.UserSessionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminDashboardService {

    private static final BigDecimal HIGH_VALUE_THRESHOLD = new BigDecimal("500.00");
    private static final ZoneId DASHBOARD_ZONE = ZoneId.of("Africa/Accra");

    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final RestaurantService restaurantService;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final AppUserRepository appUserRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserSessionRepository userSessionRepository;

    public AdminDashboardService(RestaurantRepository restaurantRepository,
                                 OrderRepository orderRepository,
                                 ReviewRepository reviewRepository,
                                 RestaurantService restaurantService,
                                 PaymentTransactionRepository paymentTransactionRepository,
                                 AppUserRepository appUserRepository,
                                 AuditLogRepository auditLogRepository,
                                 UserSessionRepository userSessionRepository) {
        this.restaurantRepository = restaurantRepository;
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
        this.restaurantService = restaurantService;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.appUserRepository = appUserRepository;
        this.auditLogRepository = auditLogRepository;
        this.userSessionRepository = userSessionRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        List<PaymentTransaction> transactions = paymentTransactionRepository.findAll();
        List<UserSession> activeSessions = getActiveSessions();
        List<RestaurantSummaryResponse> topRestaurants = getTopRestaurants();

        Instant startOfToday = LocalDate.now(DASHBOARD_ZONE).atStartOfDay(DASHBOARD_ZONE).toInstant();
        Instant startOfMonth = LocalDate.now(DASHBOARD_ZONE).with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay(DASHBOARD_ZONE).toInstant();
        Instant startOfYear = LocalDate.now(DASHBOARD_ZONE).with(TemporalAdjusters.firstDayOfYear()).atStartOfDay(DASHBOARD_ZONE).toInstant();

        BigDecimal totalRevenue = sumAmounts(transactions.stream()
                .filter(transaction -> transaction.getStatus() == PaymentStatus.PAID)
                .map(PaymentTransaction::getAmount)
                .toList());
        BigDecimal refundsTotal = sumAmounts(transactions.stream()
                .map(PaymentTransaction::getRefundedAmount)
                .toList());
        BigDecimal chargebacksTotal = sumAmounts(transactions.stream()
                .map(PaymentTransaction::getChargebackAmount)
                .toList());
        BigDecimal totalOwnerAllocations = orderRepository.findAll().stream()
                .filter(order -> order.getPaymentStatus() == PaymentStatus.PAID)
                .map(FoodOrder::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new AdminDashboardResponse(
                restaurantRepository.findByActiveTrue().size(),
                orderRepository.count(),
                reviewRepository.count(),
                appUserRepository.count(),
                activeSessions.size(),
                totalRevenue,
                countTransactionsSince(transactions, startOfToday),
                countTransactionsSince(transactions, startOfMonth),
                countTransactionsSince(transactions, startOfYear),
                refundsTotal,
                chargebacksTotal,
                totalRevenue.subtract(refundsTotal).subtract(chargebacksTotal),
                totalOwnerAllocations,
                buildVolumeTrends(transactions),
                topRestaurants
        );
    }

    @Transactional(readOnly = true)
    public List<AdminTransactionResponse> getTransactions(Instant start,
                                                          Instant end,
                                                          String status,
                                                          BigDecimal minAmount,
                                                          BigDecimal maxAmount,
                                                          String search,
                                                          String sortBy,
                                                          String sortDirection) {
        return filterTransactions(paymentTransactionRepository.findAll(), start, end, status, minAmount, maxAmount, search, sortBy, sortDirection);
    }

    @Transactional(readOnly = true)
    public String exportTransactionsCsv(Instant start,
                                        Instant end,
                                        String status,
                                        BigDecimal minAmount,
                                        BigDecimal maxAmount,
                                        String search,
                                        String sortBy,
                                        String sortDirection) {
        List<AdminTransactionResponse> transactions = getTransactions(start, end, status, minAmount, maxAmount, search, sortBy, sortDirection);
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Order ID,Reference,User Email,User Name,Amount,Status,Date Time,Method,Refunded,Chargeback,High Value\n");
        for (AdminTransactionResponse transaction : transactions) {
            csv.append(transaction.id()).append(',')
                    .append(transaction.orderId()).append(',')
                    .append(csvValue(transaction.reference())).append(',')
                    .append(csvValue(transaction.userEmail())).append(',')
                    .append(csvValue(transaction.userName())).append(',')
                    .append(transaction.amount()).append(',')
                    .append(transaction.status()).append(',')
                    .append(transaction.createdAt()).append(',')
                    .append(transaction.method()).append(',')
                    .append(transaction.refundedAmount()).append(',')
                    .append(transaction.chargebackAmount()).append(',')
                    .append(transaction.highValue())
                    .append('\n');
        }
        return csv.toString();
    }

    @Transactional(readOnly = true)
    public List<AdminAuditLogResponse> getAuditLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(log -> new AdminAuditLogResponse(
                        log.getId(),
                        log.getActorEmail(),
                        log.getActorRole().name(),
                        log.getAction(),
                        log.getTargetType(),
                        log.getTargetId(),
                        log.getDetails(),
                        log.getIpAddress(),
                        log.getCreatedAt()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminSessionResponse> getSessions() {
        return getActiveSessions().stream()
                .map(session -> new AdminSessionResponse(
                        session.getId(),
                        session.getUser().getEmail(),
                        session.getUser().getFullName(),
                        session.getUser().getRole().name(),
                        session.getIpAddress(),
                        session.getUserAgent(),
                        session.isActive(),
                        session.getCreatedAt(),
                        session.getLastSeenAt(),
                        session.getExpiresAt()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminUserInsightResponse> getUserInsights(String search) {
        List<PaymentTransaction> transactions = paymentTransactionRepository.findAll();
        String normalizedSearch = search == null ? null : search.trim().toLowerCase(Locale.ROOT);

        return appUserRepository.findAll().stream()
                .filter(user -> matchesUser(user, normalizedSearch))
                .sorted(Comparator.comparing(AppUser::getCreatedAt).reversed())
                .map(user -> toUserInsight(user, transactions))
                .toList();
    }

    private List<AdminTransactionResponse> filterTransactions(List<PaymentTransaction> source,
                                                              Instant start,
                                                              Instant end,
                                                              String status,
                                                              BigDecimal minAmount,
                                                              BigDecimal maxAmount,
                                                              String search,
                                                              String sortBy,
                                                              String sortDirection) {
        String normalizedSearch = search == null ? null : search.trim().toLowerCase(Locale.ROOT);
        String normalizedStatus = status == null ? null : status.trim().toUpperCase(Locale.ROOT);

        Comparator<AdminTransactionResponse> comparator = transactionComparator(sortBy, sortDirection);

        return source.stream()
                .map(this::toTransactionResponse)
                .filter(transaction -> start == null || !transaction.createdAt().isBefore(start))
                .filter(transaction -> end == null || !transaction.createdAt().isAfter(end))
                .filter(transaction -> normalizedStatus == null || normalizedStatus.isBlank() || transaction.status().equalsIgnoreCase(normalizedStatus))
                .filter(transaction -> minAmount == null || transaction.amount().compareTo(minAmount) >= 0)
                .filter(transaction -> maxAmount == null || transaction.amount().compareTo(maxAmount) <= 0)
                .filter(transaction -> normalizedSearch == null || normalizedSearch.isBlank() || matchesTransactionSearch(transaction, normalizedSearch))
                .sorted(comparator)
                .toList();
    }

    private AdminTransactionResponse toTransactionResponse(PaymentTransaction transaction) {
        return new AdminTransactionResponse(
                transaction.getId(),
                transaction.getOrder().getId(),
                transaction.getReference(),
                transaction.getOrder().getCustomer().getEmail(),
                transaction.getOrder().getCustomer().getFullName(),
                transaction.getAmount(),
                transaction.getStatus().name(),
                transaction.getCreatedAt(),
                transaction.getProvider(),
                transaction.getRefundedAmount(),
                transaction.getChargebackAmount(),
                transaction.getAmount().compareTo(HIGH_VALUE_THRESHOLD) >= 0
        );
    }

    private Comparator<AdminTransactionResponse> transactionComparator(String sortBy, String sortDirection) {
        String field = sortBy == null ? "date" : sortBy.toLowerCase(Locale.ROOT);
        Comparator<AdminTransactionResponse> comparator = switch (field) {
            case "amount" -> Comparator.comparing(AdminTransactionResponse::amount);
            case "status" -> Comparator.comparing(AdminTransactionResponse::status);
            case "user" -> Comparator.comparing(AdminTransactionResponse::userEmail, String.CASE_INSENSITIVE_ORDER);
            case "id" -> Comparator.comparing(AdminTransactionResponse::id);
            default -> Comparator.comparing(AdminTransactionResponse::createdAt);
        };

        if (!"asc".equalsIgnoreCase(sortDirection)) {
            comparator = comparator.reversed();
        }
        return comparator;
    }

    private boolean matchesTransactionSearch(AdminTransactionResponse transaction, String search) {
        return transaction.reference().toLowerCase(Locale.ROOT).contains(search)
                || transaction.userEmail().toLowerCase(Locale.ROOT).contains(search)
                || transaction.userName().toLowerCase(Locale.ROOT).contains(search)
                || transaction.method().toLowerCase(Locale.ROOT).contains(search)
                || transaction.status().toLowerCase(Locale.ROOT).contains(search);
    }

    private List<AdminTrendPointResponse> buildVolumeTrends(List<PaymentTransaction> transactions) {
        List<AdminTrendPointResponse> points = new ArrayList<>();
        LocalDate today = LocalDate.now(DASHBOARD_ZONE);
        for (int index = 6; index >= 0; index--) {
            LocalDate day = today.minusDays(index);
            Instant start = day.atStartOfDay(DASHBOARD_ZONE).toInstant();
            Instant end = day.plusDays(1).atStartOfDay(DASHBOARD_ZONE).toInstant();
            List<PaymentTransaction> dayTransactions = transactions.stream()
                    .filter(transaction -> !transaction.getCreatedAt().isBefore(start) && transaction.getCreatedAt().isBefore(end))
                    .toList();
            points.add(new AdminTrendPointResponse(
                    day.toString(),
                    dayTransactions.size(),
                    sumAmounts(dayTransactions.stream().map(PaymentTransaction::getAmount).toList())
            ));
        }
        return points;
    }

    private List<UserSession> getActiveSessions() {
        Instant now = Instant.now();
        return userSessionRepository.findByActiveTrueOrderByLastSeenAtDesc().stream()
                .filter(session -> session.getExpiresAt().isAfter(now))
                .toList();
    }

    private List<RestaurantSummaryResponse> getTopRestaurants() {
        return restaurantRepository.findByActiveTrue().stream()
                .map(restaurant -> restaurantService.getRestaurants(null, null, restaurant.getCity(), restaurant.getName()).stream()
                        .filter(summary -> summary.id().equals(restaurant.getId()))
                        .findFirst()
                        .orElse(null))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(RestaurantSummaryResponse::averageRating).reversed())
                .limit(5)
                .toList();
    }

    private long countTransactionsSince(List<PaymentTransaction> transactions, Instant start) {
        return transactions.stream()
                .filter(transaction -> !transaction.getCreatedAt().isBefore(start))
                .count();
    }

    private BigDecimal sumAmounts(List<BigDecimal> amounts) {
        return amounts.stream()
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private AdminUserInsightResponse toUserInsight(AppUser user, List<PaymentTransaction> transactions) {
        List<PaymentTransaction> relevantTransactions = transactions.stream()
                .filter(transaction -> isRelevantToUser(user, transaction))
                .sorted(Comparator.comparing(PaymentTransaction::getCreatedAt).reversed())
                .toList();

        List<AdminUserTransactionPreviewResponse> previews = relevantTransactions.stream()
                .limit(5)
                .map(transaction -> new AdminUserTransactionPreviewResponse(
                        transaction.getId(),
                        transaction.getReference(),
                        transaction.getAmount(),
                        transaction.getStatus().name(),
                        transaction.getCreatedAt()
                ))
                .toList();

        return new AdminUserInsightResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getAccountBalance(),
                user.getKycStatus().name(),
                user.isRiskFlagged(),
                user.getAlertNote(),
                relevantTransactions.size(),
                previews
        );
    }

    private boolean isRelevantToUser(AppUser user, PaymentTransaction transaction) {
        return transaction.getOrder().getCustomer().getId().equals(user.getId())
                || (transaction.getOrder().getRestaurant().getOwner() != null
                && transaction.getOrder().getRestaurant().getOwner().getId().equals(user.getId()));
    }

    private boolean matchesUser(AppUser user, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        return user.getEmail().toLowerCase(Locale.ROOT).contains(search)
                || user.getFullName().toLowerCase(Locale.ROOT).contains(search)
                || user.getRole().name().toLowerCase(Locale.ROOT).contains(search);
    }

    private String csvValue(String value) {
        if (value == null) {
            return "";
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
