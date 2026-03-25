package com.foodhub.platform.service;

import com.foodhub.platform.model.AppUser;
import com.foodhub.platform.model.UserSession;
import com.foodhub.platform.repository.UserSessionRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserSessionService {

    private final UserSessionRepository userSessionRepository;
    private final RequestMetadataService requestMetadataService;
    private final int maxActiveIps;

    public UserSessionService(UserSessionRepository userSessionRepository,
                              RequestMetadataService requestMetadataService,
                              @Value("${app.session.max-active-ips:2}") int maxActiveIps) {
        this.userSessionRepository = userSessionRepository;
        this.requestMetadataService = requestMetadataService;
        this.maxActiveIps = maxActiveIps;
    }

    @Transactional
    public UserSession createSession(AppUser user, Instant expiresAt) {
        deactivateExpiredSessions();

        String ipAddress = requestMetadataService.getClientIpAddress();
        List<UserSession> activeSessions = userSessionRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(session -> session.isActive() && session.getExpiresAt().isAfter(Instant.now()))
                .toList();

        Set<String> activeIps = activeSessions.stream()
                .map(UserSession::getIpAddress)
                .collect(Collectors.toSet());

        if (!activeIps.contains(ipAddress) && activeIps.size() >= maxActiveIps) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Active IP limit reached for this account");
        }

        UserSession session = new UserSession();
        session.setUser(user);
        session.setSessionId(UUID.randomUUID().toString());
        session.setIpAddress(ipAddress);
        session.setUserAgent(requestMetadataService.getUserAgent());
        session.setExpiresAt(expiresAt);
        return userSessionRepository.save(session);
    }

    @Transactional
    public boolean validateAndTouch(String sessionId, String email) {
        deactivateExpiredSessions();

        UserSession session = userSessionRepository.findBySessionId(sessionId)
                .orElse(null);
        if (session == null || !session.isActive()) {
            return false;
        }
        if (!session.getUser().getEmail().equalsIgnoreCase(email)) {
            return false;
        }
        if (!session.getUser().isActive()) {
            session.setActive(false);
            userSessionRepository.save(session);
            return false;
        }
        if (!session.getIpAddress().equals(requestMetadataService.getClientIpAddress())) {
            session.setActive(false);
            userSessionRepository.save(session);
            return false;
        }
        if (!session.getExpiresAt().isAfter(Instant.now())) {
            session.setActive(false);
            userSessionRepository.save(session);
            return false;
        }

        session.setLastSeenAt(Instant.now());
        userSessionRepository.save(session);
        return true;
    }

    @Transactional
    public void revokeSession(String sessionId) {
        userSessionRepository.findBySessionId(sessionId).ifPresent(session -> {
            session.setActive(false);
            userSessionRepository.save(session);
        });
    }

    @Transactional
    public void revokeAllSessionsForUser(Long userId) {
        userSessionRepository.findByUserIdOrderByCreatedAtDesc(userId).forEach(session -> {
            if (session.isActive()) {
                session.setActive(false);
                userSessionRepository.save(session);
            }
        });
    }

    @Transactional
    public void revokeOldestSessionForUser(Long userId) {
        userSessionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(UserSession::isActive)
                .min(Comparator.comparing(UserSession::getCreatedAt))
                .ifPresent(session -> {
                    session.setActive(false);
                    userSessionRepository.save(session);
                });
    }

    @Transactional
    public void deactivateExpiredSessions() {
        Instant now = Instant.now();
        userSessionRepository.findByActiveTrueAndExpiresAtBefore(now).forEach(session -> {
            session.setActive(false);
            userSessionRepository.save(session);
        });
    }
}
