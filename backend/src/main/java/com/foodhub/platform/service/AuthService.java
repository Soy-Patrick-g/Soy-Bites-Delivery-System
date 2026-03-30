package com.foodhub.platform.service;

import com.foodhub.platform.dto.AuthRequest;
import com.foodhub.platform.dto.AuthResponse;
import com.foodhub.platform.dto.ForgotPasswordRequest;
import com.foodhub.platform.dto.ForgotPasswordResponse;
import com.foodhub.platform.dto.MessageResponse;
import com.foodhub.platform.dto.RegisterRequest;
import com.foodhub.platform.dto.ResetPasswordRequest;
import com.foodhub.platform.dto.VerifyResetTokenRequest;
import com.foodhub.platform.dto.VerifyResetTokenResponse;
import com.foodhub.platform.config.PasswordResetProperties;
import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.model.PasswordResetToken;
import com.foodhub.platform.model.UserRole;
import com.foodhub.platform.repository.AppUserRepository;
import com.foodhub.platform.repository.PasswordResetTokenRepository;
import java.security.SecureRandom;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String FORGOT_PASSWORD_MESSAGE =
            "If an account exists for that email, a password reset link has been prepared.";
    private static final String RESET_TOKEN_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int RESET_TOKEN_LENGTH = 5;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AppUserRepository appUserRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final UserSessionService userSessionService;
    private final AuditLogService auditLogService;
    private final PasswordResetProperties passwordResetProperties;
    private final PasswordResetEmailService passwordResetEmailService;

    public AuthService(AppUserRepository appUserRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       CustomUserDetailsService userDetailsService,
                       UserSessionService userSessionService,
                       AuditLogService auditLogService,
                       PasswordResetProperties passwordResetProperties,
                       PasswordResetEmailService passwordResetEmailService) {
        this.appUserRepository = appUserRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.userSessionService = userSessionService;
        this.auditLogService = auditLogService;
        this.passwordResetProperties = passwordResetProperties;
        this.passwordResetEmailService = passwordResetEmailService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.role() != UserRole.USER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only customer accounts can be created here");
        }

        if (!request.password().equals(request.confirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password and confirm password must match");
        }

        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        AppUser user = new AppUser();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setProfileImageUrl(blankToNull(request.profileImageUrl()));
        user.setLatitude(request.latitude());
        user.setLongitude(request.longitude());
        appUserRepository.save(user);

        var session = userSessionService.createSession(user, jwtService.calculateExpirationInstant());
        String token = jwtService.generateToken(
                userDetailsService.loadUserByUsername(user.getEmail()),
                user.getRole().name(),
                session.getSessionId()
        );
        auditLogService.log(user.getEmail(), user.getRole(), "AUTH_REGISTER", "USER", String.valueOf(user.getId()), "User self-registered");
        return new AuthResponse(token, user.getFullName(), user.getEmail(), user.getRole(), user.getProfileImageUrl(), session.getExpiresAt());
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        AppUser user = appUserRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account has been disabled by an administrator");
        }

        var session = userSessionService.createSession(user, jwtService.calculateExpirationInstant());
        String token = jwtService.generateToken(
                userDetailsService.loadUserByUsername(user.getEmail()),
                user.getRole().name(),
                session.getSessionId()
        );
        auditLogService.log(user.getEmail(), user.getRole(), "AUTH_LOGIN", "USER", String.valueOf(user.getId()), "User signed in");
        return new AuthResponse(token, user.getFullName(), user.getEmail(), user.getRole(), user.getProfileImageUrl(), session.getExpiresAt());
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.email().trim();
        AppUser user = appUserRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        if (user == null) {
            return new ForgotPasswordResponse(FORGOT_PASSWORD_MESSAGE, null, null);
        }

        passwordResetTokenRepository.deleteByUser_Id(user.getId());

        PasswordResetToken passwordResetToken = new PasswordResetToken();
        passwordResetToken.setUser(user);
        passwordResetToken.setToken(generateResetToken());
        passwordResetToken.setExpiresAt(Instant.now().plusSeconds(passwordResetProperties.getTokenValidityMinutes() * 60));

        PasswordResetToken savedToken = passwordResetTokenRepository.save(passwordResetToken);
        String previewResetUrl = buildResetUrl(savedToken.getToken());

        if (passwordResetEmailService.isEnabled()) {
            passwordResetEmailService.sendPasswordResetEmail(user, previewResetUrl, savedToken.getExpiresAt());
        } else if (!passwordResetProperties.isExposeResetLink()) {
            log.warn("Password reset requested for {} but email delivery is not configured", user.getEmail());
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Password reset is temporarily unavailable. Please try again later."
            );
        }

        auditLogService.log(user.getEmail(), user.getRole(), "AUTH_PASSWORD_RESET_REQUEST", "USER", String.valueOf(user.getId()), "Password reset requested");
        log.info("Prepared password reset link for {}: {}", user.getEmail(), previewResetUrl);

        return new ForgotPasswordResponse(
                FORGOT_PASSWORD_MESSAGE,
                passwordResetProperties.isExposeResetLink() ? previewResetUrl : null,
                passwordResetProperties.isExposeResetLink() ? savedToken.getExpiresAt() : null
        );
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password and confirm password must match");
        }

        PasswordResetToken passwordResetToken = findValidResetToken(request.token());

        AppUser user = passwordResetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.password()));
        appUserRepository.save(user);

        passwordResetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(passwordResetToken);
        userSessionService.revokeAllSessionsForUser(user.getId());
        auditLogService.log(user.getEmail(), user.getRole(), "AUTH_PASSWORD_RESET_COMPLETE", "USER", String.valueOf(user.getId()), "Password reset completed");

        return new MessageResponse("Password updated successfully. You can now sign in with your new password.");
    }

    @Transactional(readOnly = true)
    public VerifyResetTokenResponse verifyResetToken(VerifyResetTokenRequest request) {
        findValidResetToken(request.token());
        return new VerifyResetTokenResponse(true, "Code verified. You can now set a new password.");
    }

    @Transactional
    public void logout(String authHeader, String requesterEmail) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return;
        }

        AppUser user = appUserRepository.findByEmailIgnoreCase(requesterEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        String sessionId = jwtService.extractSessionId(authHeader.substring(7));
        userSessionService.revokeSession(sessionId);
        auditLogService.log(user.getEmail(), user.getRole(), "AUTH_LOGOUT", "SESSION", sessionId, "User signed out");
    }

    private String generateResetToken() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder tokenBuilder = new StringBuilder(RESET_TOKEN_LENGTH);
            for (int index = 0; index < RESET_TOKEN_LENGTH; index++) {
                int nextIndex = SECURE_RANDOM.nextInt(RESET_TOKEN_CHARACTERS.length());
                tokenBuilder.append(RESET_TOKEN_CHARACTERS.charAt(nextIndex));
            }

            String token = tokenBuilder.toString();
            if (!passwordResetTokenRepository.existsByToken(token)) {
                return token;
            }
        }

        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Unable to prepare a password reset code right now.");
    }

    private String buildResetUrl(String token) {
        String baseUrl = passwordResetProperties.getFrontendResetUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            return token;
        }
        return baseUrl + (baseUrl.contains("?") ? "&" : "?") + "token=" + token;
    }

    private PasswordResetToken findValidResetToken(String rawToken) {
        PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByToken(rawToken.trim().toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset code is invalid or has expired"));

        if (passwordResetToken.isUsed() || !passwordResetToken.getExpiresAt().isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset code is invalid or has expired");
        }

        return passwordResetToken;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
