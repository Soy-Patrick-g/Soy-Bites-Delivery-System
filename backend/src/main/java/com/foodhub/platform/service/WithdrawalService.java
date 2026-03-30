package com.foodhub.platform.service;

import com.foodhub.platform.dto.AdminWithdrawalResponse;
import com.foodhub.platform.dto.CreateWithdrawalRequest;
import com.foodhub.platform.dto.WithdrawalBankOptionResponse;
import com.foodhub.platform.dto.WithdrawalDashboardResponse;
import com.foodhub.platform.dto.WithdrawalResponse;
import com.foodhub.platform.model.AccountWithdrawal;
import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.model.UserRole;
import com.foodhub.platform.model.WithdrawalStatus;
import com.foodhub.platform.repository.AccountWithdrawalRepository;
import com.foodhub.platform.repository.AppUserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WithdrawalService {

    private static final String CURRENCY = "GHS";

    private final AppUserRepository appUserRepository;
    private final AccountWithdrawalRepository accountWithdrawalRepository;
    private final RestClient restClient;
    private final AuditLogService auditLogService;

    @Value("${app.paystack.enabled:true}")
    private boolean paystackEnabled;

    @Value("${app.paystack.base-url:https://api.paystack.co}")
    private String paystackBaseUrl;

    @Value("${app.paystack.secret-key:}")
    private String paystackSecretKey;

    public WithdrawalService(AppUserRepository appUserRepository,
                             AccountWithdrawalRepository accountWithdrawalRepository,
                             RestClient.Builder restClientBuilder,
                             AuditLogService auditLogService) {
        this.appUserRepository = appUserRepository;
        this.accountWithdrawalRepository = accountWithdrawalRepository;
        this.restClient = restClientBuilder.build();
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public WithdrawalDashboardResponse getDashboard(String userEmail, UserRole expectedRole) {
        AppUser user = findUser(userEmail, expectedRole);
        List<AccountWithdrawal> withdrawals = accountWithdrawalRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        BigDecimal walletBalance = scaleMoney(user.getAccountBalance());
        BigDecimal reservedBalance = sumReserved(withdrawals);
        BigDecimal availableBalance = scaleMoney(walletBalance.subtract(reservedBalance).max(BigDecimal.ZERO));
        BigDecimal withdrawnTotal = sumByStatuses(withdrawals, List.of(WithdrawalStatus.PAID, WithdrawalStatus.COMPLETED));

        return new WithdrawalDashboardResponse(
                user.getFullName(),
                user.getEmail(),
                walletBalance,
                reservedBalance,
                availableBalance,
                withdrawnTotal,
                withdrawals.stream().map(this::toResponse).toList()
        );
    }

    @Transactional(readOnly = true)
    public List<AdminWithdrawalResponse> getAdminWithdrawals() {
        return accountWithdrawalRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toAdminResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WithdrawalBankOptionResponse> getBankOptions() {
        if (!isPaystackConfigured()) {
            return List.of();
        }

        try {
            BankListEnvelope response = restClient.get()
                    .uri(paystackBaseUrl + "/bank?currency=" + CURRENCY)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + paystackSecretKey)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(BankListEnvelope.class);

            if (response == null || !Boolean.TRUE.equals(response.status()) || response.data() == null) {
                return List.of();
            }

            return response.data().stream()
                    .filter(bank -> bank.code() != null && bank.name() != null && bank.type() != null)
                    .filter(bank -> CURRENCY.equalsIgnoreCase(bank.currency()))
                    .filter(bank -> bank.active() == null || bank.active())
                    .map(bank -> new WithdrawalBankOptionResponse(bank.code(), bank.name(), bank.type()))
                    .toList();
        } catch (RestClientResponseException exception) {
            return List.of();
        }
    }

    @Transactional
    public WithdrawalResponse createWithdrawal(String userEmail,
                                               UserRole expectedRole,
                                               CreateWithdrawalRequest request) {
        AppUser user = findUser(userEmail, expectedRole);
        BigDecimal amount = scaleMoney(request.amount());

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid withdrawal amount");
        }

        BigDecimal availableBalance = getAvailableBalance(user);
        if (availableBalance.compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Your available balance is lower than this withdrawal amount");
        }

        AccountWithdrawal withdrawal = new AccountWithdrawal();
        withdrawal.setUser(user);
        withdrawal.setAmount(amount);
        withdrawal.setProvider("PAYSTACK_TEST");
        withdrawal.setStatus(WithdrawalStatus.PENDING);
        withdrawal.setDestinationType(normalizeDestinationType(request.destinationType()));
        withdrawal.setBankCode(request.bankCode().trim());
        withdrawal.setAccountNumber(request.accountNumber().trim());
        withdrawal.setAccountName(request.accountName().trim());
        withdrawal.setReason(blankToNull(request.reason()));
        withdrawal.setReference(generateReference(user.getId()));
        withdrawal.setFailureReason(null);

        AccountWithdrawal saved = accountWithdrawalRepository.save(withdrawal);
        auditLogService.log(
                user.getEmail(),
                user.getRole(),
                "WITHDRAWAL_REQUEST",
                "WITHDRAWAL",
                String.valueOf(saved.getId()),
                "Withdrawal request submitted for " + amount
        );
        return toResponse(saved);
    }

    @Transactional
    public AdminWithdrawalResponse approveWithdrawal(Long withdrawalId, String adminEmail) {
        AccountWithdrawal withdrawal = getWithdrawalForAdminAction(withdrawalId);
        WithdrawalStatus normalized = normalizeStatus(withdrawal.getStatus());
        if (normalized == WithdrawalStatus.REJECTED || normalized == WithdrawalStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This withdrawal can no longer be approved");
        }

        withdrawal.setStatus(WithdrawalStatus.APPROVED);
        withdrawal.setReviewedAt(Instant.now());
        withdrawal.setReviewedByEmail(adminEmail);
        withdrawal.setFailureReason(null);
        AccountWithdrawal saved = accountWithdrawalRepository.save(withdrawal);
        auditLogService.log(adminEmail, UserRole.ADMIN, "WITHDRAWAL_APPROVE", "WITHDRAWAL", String.valueOf(saved.getId()), saved.getReference());
        return toAdminResponse(saved);
    }

    @Transactional
    public AdminWithdrawalResponse rejectWithdrawal(Long withdrawalId, String adminEmail, String reason) {
        AccountWithdrawal withdrawal = getWithdrawalForAdminAction(withdrawalId);
        WithdrawalStatus normalized = normalizeStatus(withdrawal.getStatus());
        if (normalized == WithdrawalStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A paid withdrawal cannot be rejected");
        }

        withdrawal.setStatus(WithdrawalStatus.REJECTED);
        withdrawal.setReviewedAt(Instant.now());
        withdrawal.setReviewedByEmail(adminEmail);
        withdrawal.setFailureReason(blankToNull(reason) == null ? "Rejected by admin" : reason.trim());
        AccountWithdrawal saved = accountWithdrawalRepository.save(withdrawal);
        auditLogService.log(adminEmail, UserRole.ADMIN, "WITHDRAWAL_REJECT", "WITHDRAWAL", String.valueOf(saved.getId()), saved.getReference());
        return toAdminResponse(saved);
    }

    @Transactional
    public AdminWithdrawalResponse processApprovedWithdrawal(Long withdrawalId, String adminEmail) {
        AccountWithdrawal withdrawal = getWithdrawalForAdminAction(withdrawalId);
        WithdrawalStatus normalized = normalizeStatus(withdrawal.getStatus());
        if (normalized != WithdrawalStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Approve this withdrawal before sending the payout");
        }

        AppUser user = withdrawal.getUser();
        BigDecimal currentBalance = scaleMoney(user.getAccountBalance());
        if (currentBalance.compareTo(scaleMoney(withdrawal.getAmount())) < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This account no longer has enough balance for the payout");
        }
        if (!isPaystackConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Paystack test mode is not configured for payouts right now");
        }

        try {
            TransferRecipientData recipient = createTransferRecipient(withdrawal);
            TransferData transfer = initiateTransfer(
                    recipient.recipient_code(),
                    withdrawal.getAmount(),
                    withdrawal.getReference(),
                    withdrawal.getReason()
            );

            withdrawal.setRecipientCode(recipient.recipient_code());
            withdrawal.setTransferCode(transfer.transfer_code());
            withdrawal.setPaystackReference(transfer.reference());
            withdrawal.setProviderStatus(transfer.status());

            if (isTransferSuccessful(transfer.status())) {
                withdrawal.setStatus(WithdrawalStatus.PAID);
                withdrawal.setProcessedAt(Instant.now());
                withdrawal.setFailureReason(null);
                user.setAccountBalance(scaleMoney(currentBalance.subtract(scaleMoney(withdrawal.getAmount()))));
                appUserRepository.save(user);
            } else {
                withdrawal.setFailureReason("Paystack has not confirmed this payout yet. You can retry once the transfer status is clear.");
            }

            AccountWithdrawal saved = accountWithdrawalRepository.save(withdrawal);
            auditLogService.log(adminEmail, UserRole.ADMIN, "WITHDRAWAL_PROCESS", "WITHDRAWAL", String.valueOf(saved.getId()), saved.getReference());
            return toAdminResponse(saved);
        } catch (RestClientResponseException exception) {
            withdrawal.setFailureReason(extractPaystackMessage(exception));
            withdrawal.setProviderStatus("failed");
            AccountWithdrawal saved = accountWithdrawalRepository.save(withdrawal);
            auditLogService.log(adminEmail, UserRole.ADMIN, "WITHDRAWAL_PROCESS_FAILED", "WITHDRAWAL", String.valueOf(saved.getId()), saved.getFailureReason());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, saved.getFailureReason());
        }
    }

    @Transactional(readOnly = true)
    public BigDecimal getPendingWithdrawalTotal() {
        return sumByStatuses(accountWithdrawalRepository.findAllByOrderByCreatedAtDesc(), List.of(WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING));
    }

    @Transactional(readOnly = true)
    public BigDecimal getApprovedWithdrawalTotal() {
        return sumByStatuses(accountWithdrawalRepository.findAllByOrderByCreatedAtDesc(), List.of(WithdrawalStatus.APPROVED));
    }

    @Transactional(readOnly = true)
    public BigDecimal getPaidWithdrawalTotal() {
        return sumByStatuses(accountWithdrawalRepository.findAllByOrderByCreatedAtDesc(), List.of(WithdrawalStatus.PAID, WithdrawalStatus.COMPLETED));
    }

    @Transactional(readOnly = true)
    public BigDecimal getRejectedWithdrawalTotal() {
        return sumByStatuses(accountWithdrawalRepository.findAllByOrderByCreatedAtDesc(), List.of(WithdrawalStatus.REJECTED, WithdrawalStatus.FAILED));
    }

    @Transactional(readOnly = true)
    public BigDecimal getReservedBalanceForUser(Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        return sumReserved(accountWithdrawalRepository.findByUserIdOrderByCreatedAtDesc(user.getId()));
    }

    @Transactional(readOnly = true)
    public BigDecimal getWithdrawnTotalForUser(Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        return sumByStatuses(accountWithdrawalRepository.findByUserIdOrderByCreatedAtDesc(user.getId()), List.of(WithdrawalStatus.PAID, WithdrawalStatus.COMPLETED));
    }

    public BigDecimal getAvailableBalance(AppUser user) {
        BigDecimal walletBalance = scaleMoney(user.getAccountBalance());
        BigDecimal reservedBalance = getReservedBalanceForUser(user.getId());
        return scaleMoney(walletBalance.subtract(reservedBalance).max(BigDecimal.ZERO));
    }

    private AccountWithdrawal getWithdrawalForAdminAction(Long withdrawalId) {
        return accountWithdrawalRepository.findById(withdrawalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Withdrawal request not found"));
    }

    private AppUser findUser(String email, UserRole expectedRole) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));

        if (user.getRole() != expectedRole) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This withdrawal page is not available for your account");
        }
        return user;
    }

    private TransferRecipientData createTransferRecipient(AccountWithdrawal withdrawal) {
        TransferRecipientEnvelope response = restClient.post()
                .uri(paystackBaseUrl + "/transferrecipient")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + paystackSecretKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(new CreateRecipientPayload(
                        withdrawal.getDestinationType(),
                        withdrawal.getAccountName(),
                        withdrawal.getAccountNumber(),
                        withdrawal.getBankCode(),
                        CURRENCY,
                        withdrawal.getReason()
                ))
                .retrieve()
                .body(TransferRecipientEnvelope.class);

        if (response == null || !Boolean.TRUE.equals(response.status()) || response.data() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to create the payout recipient");
        }

        return response.data();
    }

    private TransferData initiateTransfer(String recipientCode,
                                          BigDecimal amount,
                                          String reference,
                                          String reason) {
        TransferEnvelope response = restClient.post()
                .uri(paystackBaseUrl + "/transfer")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + paystackSecretKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(new CreateTransferPayload(
                        "balance",
                        amount.movePointRight(2).longValueExact(),
                        recipientCode,
                        reason == null ? "SOY BITES withdrawal payout" : reason,
                        CURRENCY,
                        reference.toLowerCase(Locale.ROOT)
                ))
                .retrieve()
                .body(TransferEnvelope.class);

        if (response == null || !Boolean.TRUE.equals(response.status()) || response.data() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to submit the payout transfer");
        }

        return response.data();
    }

    private WithdrawalResponse toResponse(AccountWithdrawal withdrawal) {
        return new WithdrawalResponse(
                withdrawal.getId(),
                withdrawal.getAmount(),
                displayStatus(withdrawal.getStatus()).name(),
                withdrawal.getProvider(),
                withdrawal.getReference(),
                withdrawal.getPaystackReference(),
                withdrawal.getDestinationType(),
                withdrawal.getBankCode(),
                withdrawal.getAccountNumber(),
                withdrawal.getAccountName(),
                withdrawal.getReason(),
                withdrawal.getFailureReason(),
                withdrawal.getCreatedAt(),
                withdrawal.getReviewedAt(),
                withdrawal.getProcessedAt()
        );
    }

    private AdminWithdrawalResponse toAdminResponse(AccountWithdrawal withdrawal) {
        return new AdminWithdrawalResponse(
                withdrawal.getId(),
                withdrawal.getUser().getId(),
                withdrawal.getUser().getFullName(),
                withdrawal.getUser().getEmail(),
                withdrawal.getUser().getRole().name(),
                withdrawal.getAmount(),
                displayStatus(withdrawal.getStatus()).name(),
                withdrawal.getProvider(),
                withdrawal.getReference(),
                withdrawal.getPaystackReference(),
                withdrawal.getDestinationType(),
                withdrawal.getBankCode(),
                withdrawal.getAccountNumber(),
                withdrawal.getAccountName(),
                withdrawal.getReason(),
                withdrawal.getFailureReason(),
                withdrawal.getCreatedAt(),
                withdrawal.getReviewedAt(),
                withdrawal.getProcessedAt()
        );
    }

    private WithdrawalStatus normalizeStatus(WithdrawalStatus status) {
        if (status == null) {
            return WithdrawalStatus.PENDING;
        }

        return switch (status) {
            case PROCESSING -> WithdrawalStatus.PENDING;
            case COMPLETED -> WithdrawalStatus.PAID;
            case FAILED -> WithdrawalStatus.REJECTED;
            default -> status;
        };
    }

    private WithdrawalStatus displayStatus(WithdrawalStatus status) {
        return normalizeStatus(status);
    }

    private BigDecimal sumReserved(List<AccountWithdrawal> withdrawals) {
        return sumByStatuses(withdrawals, List.of(WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED, WithdrawalStatus.PROCESSING));
    }

    private BigDecimal sumByStatuses(List<AccountWithdrawal> withdrawals, List<WithdrawalStatus> targetStatuses) {
        return withdrawals.stream()
                .filter(Objects::nonNull)
                .filter(withdrawal -> targetStatuses.contains(displayStatus(withdrawal.getStatus())))
                .map(AccountWithdrawal::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private boolean isTransferSuccessful(String status) {
        return status != null && "success".equalsIgnoreCase(status);
    }

    private boolean isPaystackConfigured() {
        return paystackEnabled && paystackSecretKey != null && !paystackSecretKey.isBlank();
    }

    private String normalizeDestinationType(String rawValue) {
        String normalized = rawValue.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "ghipss", "mobile_money" -> normalized;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a supported payout destination");
        };
    }

    private String generateReference(Long userId) {
        return "FH-WD-" + userId + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }

    private BigDecimal scaleMoney(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String extractPaystackMessage(RestClientResponseException exception) {
        String body = exception.getResponseBodyAsString();
        if (body != null && !body.isBlank()) {
            return "Paystack could not process this withdrawal. " + body;
        }
        return "Paystack could not process this withdrawal right now";
    }

    private record BankListEnvelope(Boolean status, String message, List<BankData> data) {
    }

    private record BankData(String name, String code, String type, String country, String currency, Boolean active) {
    }

    private record CreateRecipientPayload(String type,
                                          String name,
                                          String account_number,
                                          String bank_code,
                                          String currency,
                                          String description) {
    }

    private record TransferRecipientEnvelope(Boolean status, String message, TransferRecipientData data) {
    }

    private record TransferRecipientData(String recipient_code) {
    }

    private record CreateTransferPayload(String source,
                                         Long amount,
                                         String recipient,
                                         String reason,
                                         String currency,
                                         String reference) {
    }

    private record TransferEnvelope(Boolean status, String message, TransferData data) {
    }

    private record TransferData(String reference, String transfer_code, String status) {
    }
}
