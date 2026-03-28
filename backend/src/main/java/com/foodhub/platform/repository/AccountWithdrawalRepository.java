package com.foodhub.platform.repository;

import com.foodhub.platform.model.AccountWithdrawal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountWithdrawalRepository extends JpaRepository<AccountWithdrawal, Long> {

    List<AccountWithdrawal> findByUserIdOrderByCreatedAtDesc(Long userId);
}
