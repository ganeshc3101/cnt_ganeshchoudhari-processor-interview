package com.processor.api.repository;

import com.processor.api.entity.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * Spring Data JPA interface for TransactionEntity.
 * Internal to the persistence layer — MUST NOT be injected outside this package.
 */
public interface JpaTransactionRepository extends JpaRepository<TransactionEntity, UUID> {
}
