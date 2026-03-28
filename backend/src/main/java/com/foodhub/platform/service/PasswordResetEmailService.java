package com.foodhub.platform.service;

import com.foodhub.platform.config.AppBrevoProperties;
import com.foodhub.platform.model.AppUser;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetEmailService {

    private static final DateTimeFormatter EXPIRY_FORMAT =
            DateTimeFormatter.ofPattern("MMM d, yyyy 'at' h:mm a z").withZone(ZoneId.of("Africa/Accra"));

    private final BrevoEmailService brevoEmailService;
    private final AppBrevoProperties appBrevoProperties;

    public PasswordResetEmailService(BrevoEmailService brevoEmailService, AppBrevoProperties appBrevoProperties) {
        this.brevoEmailService = brevoEmailService;
        this.appBrevoProperties = appBrevoProperties;
    }

    public boolean isEnabled() {
        return brevoEmailService.isEnabled();
    }

    public void sendPasswordResetEmail(AppUser user, String resetUrl, Instant expiresAt) {
        brevoEmailService.sendTransactionalEmail(
                user.getEmail(),
                user.getFullName(),
                "Reset your FoodHub password",
                buildMessage(user, resetUrl, expiresAt)
        );
    }

    private String buildMessage(AppUser user, String resetUrl, Instant expiresAt) {
        String resetCode = extractResetCode(resetUrl);
        return """
                Hello %s,

                We received a request to reset your FoodHub password.

                Your reset code is: %s

                Use the link below to choose a new password:
                %s

                This link will expire on %s.

                If you did not request a password reset, you can ignore this email and your password will stay the same.

                %s Support
                """.formatted(
                user.getFullName(),
                resetCode,
                resetUrl,
                EXPIRY_FORMAT.format(expiresAt),
                appBrevoProperties.getSenderName()
        );
    }

    private String extractResetCode(String resetUrl) {
        int tokenIndex = resetUrl.indexOf("token=");
        if (tokenIndex < 0) {
            return resetUrl;
        }
        return resetUrl.substring(tokenIndex + 6);
    }
}
