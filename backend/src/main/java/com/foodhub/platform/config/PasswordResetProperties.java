package com.foodhub.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.auth.password-reset")
public class PasswordResetProperties {

    private long tokenValidityMinutes = 30;
    private boolean exposeResetLink = true;
    private String frontendResetUrl = "http://localhost:3000/reset-password";

    public long getTokenValidityMinutes() {
        return tokenValidityMinutes;
    }

    public void setTokenValidityMinutes(long tokenValidityMinutes) {
        this.tokenValidityMinutes = tokenValidityMinutes;
    }

    public boolean isExposeResetLink() {
        return exposeResetLink;
    }

    public void setExposeResetLink(boolean exposeResetLink) {
        this.exposeResetLink = exposeResetLink;
    }

    public String getFrontendResetUrl() {
        return frontendResetUrl;
    }

    public void setFrontendResetUrl(String frontendResetUrl) {
        this.frontendResetUrl = frontendResetUrl;
    }
}
