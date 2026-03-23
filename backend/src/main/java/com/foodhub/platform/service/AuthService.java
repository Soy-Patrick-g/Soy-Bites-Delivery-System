package com.foodhub.platform.service;

import com.foodhub.platform.dto.AuthRequest;
import com.foodhub.platform.dto.AuthResponse;
import com.foodhub.platform.dto.RegisterRequest;
import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.repository.AppUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final UserSessionService userSessionService;
    private final AuditLogService auditLogService;

    public AuthService(AppUserRepository appUserRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       CustomUserDetailsService userDetailsService,
                       UserSessionService userSessionService,
                       AuditLogService auditLogService) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.userSessionService = userSessionService;
        this.auditLogService = auditLogService;
    }

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

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        AppUser user = appUserRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        var session = userSessionService.createSession(user, jwtService.calculateExpirationInstant());
        String token = jwtService.generateToken(
                userDetailsService.loadUserByUsername(user.getEmail()),
                user.getRole().name(),
                session.getSessionId()
        );
        auditLogService.log(user.getEmail(), user.getRole(), "AUTH_LOGIN", "USER", String.valueOf(user.getId()), "User signed in");
        return new AuthResponse(token, user.getFullName(), user.getEmail(), user.getRole(), session.getExpiresAt());
    }

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
}
