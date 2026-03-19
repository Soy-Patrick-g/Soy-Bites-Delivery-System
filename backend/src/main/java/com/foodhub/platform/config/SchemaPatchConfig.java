package com.foodhub.platform.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import javax.sql.DataSource;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class SchemaPatchConfig {

    @Bean
    @Order(0)
    CommandLineRunner patchAppUserRoleConstraint(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                DatabaseMetaData metadata = connection.getMetaData();
                String productName = metadata.getDatabaseProductName();
                if (productName == null || !productName.toLowerCase().contains("postgresql")) {
                    return;
                }
            }

            jdbcTemplate.execute("ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check");
            jdbcTemplate.execute(
                    "ALTER TABLE app_users ADD CONSTRAINT app_users_role_check " +
                            "CHECK (role IN ('USER', 'DELIVERY', 'RESTAURANT', 'ADMIN'))"
            );
        };
    }
}
