package com.foodhub.platform.service;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class RequestMetadataService {

    public String getClientIpAddress() {
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return "unknown";
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return normalizeIpAddress(forwardedFor.split(",")[0].trim());
        }
        return normalizeIpAddress(request.getRemoteAddr());
    }

    public String getUserAgent() {
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return null;
        }
        return request.getHeader("User-Agent");
    }

    private HttpServletRequest currentRequest() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (attributes instanceof ServletRequestAttributes servletRequestAttributes) {
            return servletRequestAttributes.getRequest();
        }
        return null;
    }

    public String normalizeIpAddress(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return "unknown";
        }

        String normalized = ipAddress.trim().toLowerCase(Locale.ROOT);
        if ("::1".equals(normalized)
                || "0:0:0:0:0:0:0:1".equals(normalized)
                || "[::1]".equals(normalized)
                || "localhost".equals(normalized)) {
            return "127.0.0.1";
        }

        if (normalized.startsWith("::ffff:")) {
            return normalized.substring(7);
        }

        return normalized;
    }
}
