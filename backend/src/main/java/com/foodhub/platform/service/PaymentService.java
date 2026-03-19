package com.foodhub.platform.service;

import com.foodhub.platform.dto.PaymentInitializationResponse;
import com.foodhub.platform.model.FoodOrder;
import com.foodhub.platform.model.PaymentStatus;
import com.foodhub.platform.model.PaymentTransaction;
import com.foodhub.platform.repository.PaymentTransactionRepository;
import java.time.Instant;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RestClient restClient;

    @Value("${app.paystack.enabled:false}")
    private boolean paystackEnabled;

    @Value("${app.paystack.base-url:https://api.paystack.co}")
    private String paystackBaseUrl;

    @Value("${app.paystack.secret-key}")
    private String paystackSecretKey;

    @Value("${app.paystack.callback-url}")
    private String callbackUrl;

    public PaymentService(PaymentTransactionRepository paymentTransactionRepository, RestClient.Builder restClientBuilder) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.restClient = restClientBuilder.build();
    }

    @Transactional
    public PaymentInitializationResponse initializeTransaction(FoodOrder order) {
        String reference = "FH-" + order.getId() + "-" + Instant.now().toEpochMilli();
        boolean simulated = !paystackEnabled;
        PaymentInitializationResponse payment = simulated
                ? new PaymentInitializationResponse("PAYSTACK", reference, callbackUrl + "?reference=" + reference + "&mode=demo", true)
                : initializeWithPaystack(order, reference);

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setOrder(order);
        transaction.setProvider("PAYSTACK");
        transaction.setReference(payment.reference());
        transaction.setAuthorizationUrl(payment.authorizationUrl());
        transaction.setStatus(PaymentStatus.INITIALIZED);
        transaction.setAmount(order.getTotal());
        paymentTransactionRepository.save(transaction);

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
            transaction.getOrder().setPaymentStatus(PaymentStatus.PAID);
            paymentTransactionRepository.save(transaction);
            return transaction.getOrder();
        }

        PaystackVerifyEnvelope response = restClient.get()
                .uri(paystackBaseUrl + "/transaction/verify/{reference}", reference)
                .header("Authorization", "Bearer " + paystackSecretKey)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(PaystackVerifyEnvelope.class);

        if (response == null || !Boolean.TRUE.equals(response.status()) || response.data() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify Paystack payment");
        }

        String paystackStatus = response.data().status();
        PaymentStatus paymentStatus = switch (paystackStatus == null ? "" : paystackStatus.toLowerCase()) {
            case "success" -> PaymentStatus.PAID;
            case "failed", "abandoned" -> PaymentStatus.FAILED;
            default -> PaymentStatus.INITIALIZED;
        };

        transaction.setStatus(paymentStatus);
        transaction.getOrder().setPaymentStatus(paymentStatus);
        paymentTransactionRepository.save(transaction);
        return transaction.getOrder();
    }

    private PaymentInitializationResponse initializeWithPaystack(FoodOrder order, String reference) {
        PaystackInitializeEnvelope response = restClient.post()
                .uri(paystackBaseUrl + "/transaction/initialize")
                .header("Authorization", "Bearer " + paystackSecretKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "email", order.getCustomer().getEmail(),
                        "amount", order.getTotal().movePointRight(2).intValueExact(),
                        "reference", reference,
                        "callback_url", callbackUrl
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

    private record PaystackVerifyData(String status, String reference) {
    }

    private boolean isSimulated(PaymentTransaction transaction) {
        String authorizationUrl = transaction.getAuthorizationUrl();
        return authorizationUrl != null && authorizationUrl.contains("mode=demo");
    }
}
