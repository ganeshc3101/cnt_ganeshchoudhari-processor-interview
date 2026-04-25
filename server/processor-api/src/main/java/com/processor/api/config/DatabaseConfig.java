package com.processor.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Placeholder for database-related configuration.
 * Transactions are enabled here; datasource is auto-configured from application.yml.
 * Explicit DataSource/EntityManager beans can be added here if needed later.
 */
@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(basePackages = "com.processor.api.repository")
public class DatabaseConfig {
}
