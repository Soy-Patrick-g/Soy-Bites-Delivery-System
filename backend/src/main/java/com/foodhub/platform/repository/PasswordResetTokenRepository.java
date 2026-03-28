package com.foodhub.platform.repository;

import com.foodhub.platform.model.PasswordResetToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    @EntityGraph(attributePaths = {"user"})
    Optional<PasswordResetToken> findByToken(String token);

    boolean existsByToken(String token);

    void deleteByUser_Id(Long userId);
}
