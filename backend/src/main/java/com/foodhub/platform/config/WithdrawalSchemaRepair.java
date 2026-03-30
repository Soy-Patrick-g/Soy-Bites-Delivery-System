package com.foodhub.platform.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.jdbc.core.JdbcTemplate;

@Component
public class WithdrawalSchemaRepair {

    private static final Logger log = LoggerFactory.getLogger(WithdrawalSchemaRepair.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public WithdrawalSchemaRepair(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void repairWithdrawalStatusConstraint() {
        if (!isPostgreSql()) {
            return;
        }

        jdbcTemplate.execute("""
                DO $$
                BEGIN
                    IF to_regclass('account_withdrawals') IS NOT NULL THEN
                        EXECUTE 'ALTER TABLE account_withdrawals DROP CONSTRAINT IF EXISTS account_withdrawals_status_check';
                        EXECUTE 'ALTER TABLE account_withdrawals ADD CONSTRAINT account_withdrawals_status_check CHECK (status IN (''PENDING'',''APPROVED'',''REJECTED'',''PAID'',''PROCESSING'',''COMPLETED'',''FAILED''))';
                    END IF;
                END $$;
                """);

        log.info("Withdrawal status constraint checked and repaired if needed");
    }

    private boolean isPostgreSql() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            return metaData != null
                    && metaData.getDatabaseProductName() != null
                    && metaData.getDatabaseProductName().toLowerCase().contains("postgres");
        } catch (SQLException exception) {
            log.warn("Could not inspect database metadata before withdrawal schema repair", exception);
            return false;
        }
    }
}
