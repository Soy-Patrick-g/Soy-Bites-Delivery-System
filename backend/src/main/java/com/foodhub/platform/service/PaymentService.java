package com.foodhub.platform.service;

import com.foodhub.platform.dto.PaymentInitializationResponse;
import com.foodhub.platform.model.FoodOrder;
import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.model.PaymentStatus;
import com.foodhub.platform.model.PaymentTransaction;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodhub.platform.repository.OrderRepository;
import com.foodhub.platform.repository.PaymentTransactionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderRepository orderRepository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final AuditLogService auditLogService;

    @Value("${app.paystack.enabled:false}")
    private boolean paystackEnabled;

    @Value("${app.paystack.base-url:https://api.paystack.co}")
    private String paystackBaseUrl;

    @Value("${app.paystack.secret-key}")
    private String paystackSecretKey;

    @Value("${app.paystack.callback-url}")
    private String callbackUrl;

    public PaymentService(PaymentTransactionRepository paymentTransactionRepository,
                          OrderRepository orderRepository,
                          RestClient.Builder restClientBuilder,
                          ObjectMapper objectMapper,
                          AuditLogService auditLogService) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.orderRepository = orderRepository;
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public PaymentInitializationResponse initializeTransaction(FoodOrder order) {
        return initializeTransaction(order, order.getTotal(), order.getRestaurant().getName());
    }

    @Transactional
    public PaymentInitializationResponse initializeTransaction(FoodOrder order, BigDecimal amount, String description) {
        String reference = "FH-" + order.getId() + "-" + Instant.now().toEpochMilli();
        boolean simulated = !paystackEnabled;
        PaymentInitializationResponse payment = simulated
                ? new PaymentInitializationResponse("PAYSTACK", reference, callbackUrl + "?reference=" + reference + "&mode=demo", true)
                : initializeWithPaystack(order, reference, amount, description);

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setOrder(order);
        transaction.setProvider("PAYSTACK");
        transaction.setReference(payment.reference());
        transaction.setAuthorizationUrl(payment.authorizationUrl());
        transaction.setStatus(PaymentStatus.INITIALIZED);
        transaction.setAmount(amount);
        paymentTransactionRepository.save(transaction);
        auditLogService.log(order.getCustomer().getEmail(), order.getCustomer().getRole(), "PAYMENT_INITIALIZE", "PAYMENT_TRANSACTION", transaction.getReference(), "Initialized " + payment.provider() + " payment");

        order.setPaymentReference(payment.reference());
        order.setPaymentStatus(PaymentStatus.INITIALIZED);

        return payment;
    }

    @Transactional(readOnly = true)
    public PaymentInitializationResponse getPaymentDetails(FoodOrder order) {
        if (order.getPaymentReference() == null || order.getPaymentReference().isBlank()) {
            return null;
        }

        return paymentTransactionRepository.findByReference(order.getPaymentReference())
                .map(transaction -> new PaymentInitializationResponse(
                        transaction.getProvider(),
                        transaction.getReference(),
                        transaction.getAuthorizationUrl(),
                        isSimulated(transaction)
                ))
                .orElse(null);
    }

    @Transactional
    public FoodOrder verifyTransaction(String reference) {
        PaymentTransaction transaction = paymentTransactionRepository.findByReference(reference)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment reference not found"));

        if (transaction.getStatus() == PaymentStatus.PAID) {
            return transaction.getOrder();
        }

        if (isSimulated(transaction)) {
            transaction.setStatus(PaymentStatus.PAID);
            updateGroupPaymentStatus(transaction.getOrder(), PaymentStatus.PAID);
            creditRestaurantOwners(transaction.getOrder());
            paymentTransactionRepository.save(transaction);
            auditLogService.log(transaction.getOrder().getCustomer().getEmail(), transaction.getOrder().getCustomer().getRole(), "PAYMENT_VERIFY", "PAYMENT_TRANSACTION", transaction.getReference(), "Demo payment marked as paid");
            return transaction.getOrder();
        }

        PaystackVerifyEnvelope response = restClient.get()
                .uri(paystackBaseUrl + "/transaction/verify/{reference}", reference)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + paystackSecretKey)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(PaystackVerifyEnvelope.class);

        if (response == null || !Boolean.TRUE.equals(response.status()) || response.data() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify Paystack payment");
        }

        String paystackStatus = response.data().status();
        if (response.data().amount() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Paystack did not return a verified amount");
        }

        BigDecimal verifiedAmount = BigDecimal.valueOf(response.data().amount()).movePointLeft(2);
        if (verifiedAmount.compareTo(transaction.getAmount()) != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Verified amount does not match the order total");
        }

        PaymentStatus paymentStatus = switch (paystackStatus == null ? "" : paystackStatus.toLowerCase()) {
            case "success" -> PaymentStatus.PAID;
            case "failed", "abandoned" -> PaymentStatus.FAILED;
            default -> PaymentStatus.INITIALIZED;
        };

        transaction.setStatus(paymentStatus);
        updateGroupPaymentStatus(transaction.getOrder(), paymentStatus);
        if (paymentStatus == PaymentStatus.PAID) {
            creditRestaurantOwners(transaction.getOrder());
        }
        paymentTransactionRepository.save(transaction);
        auditLogService.log(transaction.getOrder().getCustomer().getEmail(), transaction.getOrder().getCustomer().getRole(), "PAYMENT_VERIFY", "PAYMENT_TRANSACTION", transaction.getReference(), "Payment status is " + paymentStatus);
        return transaction.getOrder();
    }

    private PaymentInitializationResponse initializeWithPaystack(FoodOrder order, String reference, BigDecimal amount, String description) {
        PaystackInitializeEnvelope response = restClient.post()
                .uri(paystackBaseUrl + "/transaction/initialize")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + paystackSecretKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "email", order.getCustomer().getEmail(),
                        "amount", amount.movePointRight(2).longValueExact(),
                        "reference", reference,
                        "callback_url", callbackUrl,
                        "metadata", metadataFor(order, description)
                ))
                .retrieve()
                .body(PaystackInitializeEnvelope.class);

        if (response == null || !Boolean.TRUE.equals(response.status()) || response.data() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to initialize Paystack transaction");
        }

        return new PaymentInitializationResponse(
                "PAYSTACK",
                response.data().reference(),
                response.data().authorization_url(),
                false
        );
    }

    private record PaystackInitializeEnvelope(Boolean status, String message, PaystackInitializeData data) {
    }

    private record PaystackInitializeData(String authorization_url, String access_code, String reference) {
    }

    private record PaystackVerifyEnvelope(Boolean status, String message, PaystackVerifyData data) {
    }

    private record PaystackVerifyData(String status, String reference, Long amount) {
    }

    private boolean isSimulated(PaymentTransaction transaction) {
        String authorizationUrl = transaction.getAuthorizationUrl();
        return authorizationUrl != null && authorizationUrl.contains("mode=demo");
    }

    private String metadataFor(FoodOrder order, String description) {
        try {
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("orderId", order.getId());
            metadata.put("customerEmail", order.getCustomer().getEmail());
            metadata.put("restaurantName", order.getRestaurant().getName());
            metadata.put("description", description);
            if (order.getGroupReference() != null && !order.getGroupReference().isBlank()) {
                metadata.put("groupReference", order.getGroupReference());
            }
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to serialize Paystack metadata");
        }
    }

    private void updateGroupPaymentStatus(FoodOrder order, PaymentStatus paymentStatus) {
        if (order.getGroupReference() != null && !order.getGroupReference().isBlank()) {
            orderRepository.findByGroupReferenceOrderByCreatedAtAsc(order.getGroupReference())
                    .forEach(groupedOrder -> groupedOrder.setPaymentStatus(paymentStatus));
        } else {
            order.setPaymentStatus(paymentStatus);
        }
    }

    private void creditRestaurantOwners(FoodOrder order) {
        if (order.getGroupReference() != null && !order.getGroupReference().isBlank()) {
            orderRepository.findByGroupReferenceOrderByCreatedAtAsc(order.getGroupReference())
                    .forEach(this::creditOwnerAllocation);
            return;
        }
        creditOwnerAllocation(order);
    }

    private void creditOwnerAllocation(FoodOrder order) {
        if (order.getRestaurant() == null || order.getRestaurant().getOwner() == null) {
            return;
        }
        AppUser owner = order.getRestaurant().getOwner();
        owner.setAccountBalance(owner.getAccountBalance().add(order.getSubtotal()));
    }
}
