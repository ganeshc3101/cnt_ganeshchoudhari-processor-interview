package com.processor.api.repository;

import com.processor.api.entity.RejectedTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * Spring Data JPA interface for RejectedTransactionEntity.
 * Internal to the persistence layer — MUST NOT be injected outside this package.
 */
public interface JpaRejectedTransactionRepository extends JpaRepository<RejectedTransactionEntity, UUID> {
}
