package com.foodhub.platform.service;

import com.foodhub.platform.dto.AuthRequest;
import com.foodhub.platform.dto.AuthResponse;
import com.foodhub.platform.dto.ForgotPasswordRequest;
import com.foodhub.platform.dto.ForgotPasswordResponse;
import com.foodhub.platform.dto.MessageResponse;
import com.foodhub.platform.dto.RegisterRequest;
import com.foodhub.platform.dto.ResetPasswordRequest;
import com.foodhub.platform.config.PasswordResetProperties;
import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.model.PasswordResetToken;
import com.foodhub.platform.repository.AppUserRepository;
import com.foodhub.platform.repository.PasswordResetTokenRepository;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
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

    public AuthService(AppUserRepository appUserRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       CustomUserDetailsService userDetailsService,
                       UserSessionService userSessionService,
                       AuditLogService auditLogService,
                       PasswordResetProperties passwordResetProperties) {
        this.appUserRepository = appUserRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.userSessionService = userSessionService;
        this.auditLogService = auditLogService;
        this.passwordResetProperties = passwordResetProperties;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        AppUser user = new AppUser();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
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
        return new AuthResponse(token, user.getFullName(), user.getEmail(), user.getRole(), session.getExpiresAt());
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
        return new AuthResponse(token, user.getFullName(), user.getEmail(), user.getRole(), session.getExpiresAt());
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

        PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByToken(request.token().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset link is invalid or has expired"));

        if (passwordResetToken.isUsed() || !passwordResetToken.getExpiresAt().isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset link is invalid or has expired");
        }

        AppUser user = passwordResetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.password()));
        appUserRepository.save(user);

        passwordResetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(passwordResetToken);
        userSessionService.revokeAllSessionsForUser(user.getId());
        auditLogService.log(user.getEmail(), user.getRole(), "AUTH_PASSWORD_RESET_COMPLETE", "USER", String.valueOf(user.getId()), "Password reset completed");

        return new MessageResponse("Password updated successfully. You can now sign in with your new password.");
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
        byte[] tokenBytes = new byte[32];
        SECURE_RANDOM.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    private String buildResetUrl(String token) {
        String baseUrl = passwordResetProperties.getFrontendResetUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            return token;
        }
        return baseUrl + (baseUrl.contains("?") ? "&" : "?") + "token=" + token;
    }
}
