package com.foodhub.platform.service;

import com.foodhub.platform.config.AppBrevoProperties;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BrevoEmailService {

    private static final Logger log = LoggerFactory.getLogger(BrevoEmailService.class);

    private final AppBrevoProperties appBrevoProperties;

    public BrevoEmailService(AppBrevoProperties appBrevoProperties) {
        this.appBrevoProperties = appBrevoProperties;
    }

    public boolean isEnabled() {
        return appBrevoProperties.isEnabled()
                && appBrevoProperties.getApiKey() != null
                && !appBrevoProperties.getApiKey().isBlank();
    }

    public void sendTransactionalEmail(String recipientEmail,
                                       String recipientName,
                                       String subject,
                                       String textContent) {
        if (!isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Email delivery is not configured right now."
            );
        }

        if (appBrevoProperties.getSenderEmail() == null || appBrevoProperties.getSenderEmail().isBlank()) {
            log.warn("Brevo email sending was enabled without a configured sender email");
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Email delivery is not configured right now."
            );
        }

        SendEmailRequest payload = new SendEmailRequest(
                new Contact(appBrevoProperties.getSenderEmail(), appBrevoProperties.getSenderName()),
                List.of(new Contact(recipientEmail, resolveRecipientName(recipientEmail, recipientName))),
                subject,
                textContent
        );

        try {
            RestClient.create().post()
                    .uri(buildEndpointUrl())
                    .accept(MediaType.APPLICATION_JSON)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("api-key", appBrevoProperties.getApiKey())
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Brevo email sent to {}", recipientEmail);
        } catch (RestClientResponseException ex) {
            log.error(
                    "Brevo email delivery failed for {} with status {} and body: {}",
                    recipientEmail,
                    ex.getStatusCode(),
                    ex.getResponseBodyAsString(),
                    ex
            );
            throw new ResponseStatusException(mapStatus(ex), mapMessage(ex));
        } catch (RestClientException ex) {
            log.error("Brevo email delivery failed for {}", recipientEmail, ex);
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "We couldn’t send the email right now. Please try again shortly."
            );
        }
    }

    private String buildEndpointUrl() {
        String baseUrl = appBrevoProperties.getBaseUrl();
        if (baseUrl.endsWith("/")) {
            return baseUrl + "v3/smtp/email";
        }
        return baseUrl + "/v3/smtp/email";
    }

    private String resolveRecipientName(String recipientEmail, String recipientName) {
        if (recipientName == null || recipientName.isBlank()) {
            return recipientEmail;
        }
        return recipientName;
    }

    private HttpStatus mapStatus(RestClientResponseException ex) {
        return ex.getStatusCode().is4xxClientError() ? HttpStatus.BAD_REQUEST : HttpStatus.SERVICE_UNAVAILABLE;
    }

    private String mapMessage(RestClientResponseException ex) {
        if (ex.getStatusCode().value() == 401 || ex.getStatusCode().value() == 403) {
            return "Brevo rejected the email request. Please confirm your API key is valid and has transactional email access.";
        }

        if (ex.getStatusCode().value() == 400) {
            return "Brevo rejected the email request. Please confirm the sender email is verified in Brevo and the domain is authenticated.";
        }

        return "We couldn’t send the email right now. Please try again shortly.";
    }

    private record Contact(String email, String name) {
    }

    private record SendEmailRequest(
            Contact sender,
            List<Contact> to,
            String subject,
            String textContent
    ) {
    }
}
