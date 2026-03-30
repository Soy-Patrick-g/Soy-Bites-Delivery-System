package com.foodhub.platform.service;

import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.model.UserRole;
import com.foodhub.platform.repository.AppUserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RequestAuthenticationService {

    private static final Logger log = LoggerFactory.getLogger(RequestAuthenticationService.class);
    private static final String AUTH_COOKIE_NAME = "foodhub_token";

    private final JwtService jwtService;
    private final AppUserRepository appUserRepository;

    public RequestAuthenticationService(JwtService jwtService, AppUserRepository appUserRepository) {
        this.jwtService = jwtService;
        this.appUserRepository = appUserRepository;
    }

    public AppUser requireUser(HttpServletRequest request, UserRole expectedRole) {
        log.info("Request auth check starting for {} {} expecting {}", request.getMethod(), request.getRequestURI(), expectedRole);
        String token = resolveToken(request);
        if (token == null || token.isBlank()) {
            log.warn("Request auth failed: token missing for {} {}", request.getMethod(), request.getRequestURI());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Your session has ended. Please sign in again and try once more.");
        }

        try {
            if (!jwtService.isTokenValid(token)) {
                log.warn("Request auth failed: token invalid for {} {}", request.getMethod(), request.getRequestURI());
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Your session has ended. Please sign in again and try once more.");
            }

            String email = jwtService.extractUsername(token);
            String role = jwtService.extractRole(token);
            if (email == null || role == null || !expectedRole.name().equalsIgnoreCase(role)) {
                log.warn("Request auth failed: role mismatch. expected={}, actual={}, email={}, path={} {}",
                        expectedRole, role, email, request.getMethod(), request.getRequestURI());
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This action is not available for your account.");
            }

            AppUser user = appUserRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> {
                        log.warn("Request auth failed: user lookup returned nothing for email {} on {} {}", email, request.getMethod(), request.getRequestURI());
                        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Your session has ended. Please sign in again and try once more.");
                    });

            if (!user.isActive()) {
                log.warn("Request auth failed: inactive user {} for {} {}", email, request.getMethod(), request.getRequestURI());
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This action is not available for your account.");
            }

            if (user.getRole() != expectedRole) {
                log.warn("Request auth failed: persisted role mismatch. expected={}, actual={}, email={}, path={} {}",
                        expectedRole, user.getRole(), email, request.getMethod(), request.getRequestURI());
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This action is not available for your account.");
            }

            return user;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.warn("Request auth failed with runtime exception for {} {}: {}", request.getMethod(), request.getRequestURI(), exception.getMessage());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Your session has ended. Please sign in again and try once more.");
        }
    }

    private String resolveToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if (AUTH_COOKIE_NAME.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                return URLDecoder.decode(cookie.getValue(), StandardCharsets.UTF_8);
            }
        }

        return null;
    }
}
