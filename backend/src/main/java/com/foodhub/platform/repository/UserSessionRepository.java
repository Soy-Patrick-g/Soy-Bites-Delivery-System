package com.foodhub.platform.repository;

import com.foodhub.platform.model.UserSession;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    @EntityGraph(attributePaths = {"user"})
    Optional<UserSession> findBySessionId(String sessionId);

    @EntityGraph(attributePaths = {"user"})
    List<UserSession> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"user"})
    List<UserSession> findByActiveTrueOrderByLastSeenAtDesc();

    List<UserSession> findByActiveTrueAndExpiresAtBefore(Instant cutoff);
}
