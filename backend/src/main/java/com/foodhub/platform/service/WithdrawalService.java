package com.foodhub.platform.service;

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

    @Value("${app.paystack.enabled:false}")
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
        return new WithdrawalDashboardResponse(
                user.getFullName(),
                user.getEmail(),
                scaleMoney(user.getAccountBalance()),
                accountWithdrawalRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    @Transactional(readOnly = true)
    public List<WithdrawalBankOptionResponse> getBankOptions() {
        if (!paystackEnabled || paystackSecretKey == null || paystackSecretKey.isBlank()) {
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
        if (user.getAccountBalance().compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Your available balance is lower than this withdrawal amount");
        }

        AccountWithdrawal withdrawal = new AccountWithdrawal();
        withdrawal.setUser(user);
        withdrawal.setAmount(amount);
        withdrawal.setProvider("PAYSTACK");
        withdrawal.setDestinationType(normalizeDestinationType(request.destinationType()));
        withdrawal.setBankCode(request.bankCode().trim());
        withdrawal.setAccountNumber(request.accountNumber().trim());
        withdrawal.setAccountName(request.accountName().trim());
        withdrawal.setReason(blankToNull(request.reason()));
        withdrawal.setReference(generateReference(user.getId()));

        if (!paystackEnabled || paystackSecretKey == null || paystackSecretKey.isBlank()) {
            withdrawal.setStatus(WithdrawalStatus.COMPLETED);
            withdrawal.setProcessedAt(Instant.now());
            withdrawal.setProviderStatus("success");
            withdrawal.setTransferCode("demo-transfer");
            user.setAccountBalance(scaleMoney(user.getAccountBalance().subtract(amount)));
            appUserRepository.save(user);
            AccountWithdrawal saved = accountWithdrawalRepository.save(withdrawal);
            auditLogService.log(user.getEmail(), user.getRole(), "WITHDRAWAL_CREATE", "WITHDRAWAL", String.valueOf(saved.getId()), "Demo withdrawal completed");
            return toResponse(saved);
        }

        try {
            TransferRecipientData recipient = createTransferRecipient(withdrawal);
            TransferData transfer = initiateTransfer(recipient.recipient_code(), amount, withdrawal.getReference(), withdrawal.getReason());

            withdrawal.setRecipientCode(recipient.recipient_code());
            withdrawal.setTransferCode(transfer.transfer_code());
            withdrawal.setProviderStatus(transfer.status());
            withdrawal.setStatus(mapTransferStatus(transfer.status()));
            if (withdrawal.getStatus() != WithdrawalStatus.FAILED) {
                withdrawal.setProcessedAt(Instant.now());
                user.setAccountBalance(scaleMoney(user.getAccountBalance().subtract(amount)));
                appUserRepository.save(user);
            }

            AccountWithdrawal saved = accountWithdrawalRepository.save(withdrawal);
            auditLogService.log(user.getEmail(), user.getRole(), "WITHDRAWAL_CREATE", "WITHDRAWAL", String.valueOf(saved.getId()), "Withdrawal submitted with status " + saved.getStatus());
            return toResponse(saved);
        } catch (RestClientResponseException exception) {
            String message = extractPaystackMessage(exception);
            withdrawal.setStatus(WithdrawalStatus.FAILED);
            withdrawal.setFailureReason(message);
            AccountWithdrawal saved = accountWithdrawalRepository.save(withdrawal);
            auditLogService.log(user.getEmail(), user.getRole(), "WITHDRAWAL_CREATE_FAILED", "WITHDRAWAL", String.valueOf(saved.getId()), message);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, message);
        }
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
                        reason == null ? "FoodHub withdrawal" : reason,
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
                withdrawal.getStatus().name(),
                withdrawal.getProvider(),
                withdrawal.getReference(),
                withdrawal.getDestinationType(),
                withdrawal.getBankCode(),
                withdrawal.getAccountNumber(),
                withdrawal.getAccountName(),
                withdrawal.getReason(),
                withdrawal.getFailureReason(),
                withdrawal.getCreatedAt(),
                withdrawal.getProcessedAt()
        );
    }

    private WithdrawalStatus mapTransferStatus(String status) {
        if (status == null) {
            return WithdrawalStatus.PROCESSING;
        }

        return switch (status.toLowerCase(Locale.ROOT)) {
            case "success" -> WithdrawalStatus.COMPLETED;
            case "failed", "reversed" -> WithdrawalStatus.FAILED;
            default -> WithdrawalStatus.PROCESSING;
        };
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
