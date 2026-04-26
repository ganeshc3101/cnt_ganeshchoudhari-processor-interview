package com.processor.api.repository;

import com.processor.api.entity.RejectedTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

/**
 * Spring Data JPA interface for RejectedTransactionEntity.
 * Internal to the persistence layer — MUST NOT be injected outside this package.
 */
public interface JpaRejectedTransactionRepository extends JpaRepository<RejectedTransactionEntity, UUID> {

    @Query("select count(r) from RejectedTransactionEntity r where r.createdAt >= :f and r.createdAt < :t")
    long countCreatedBetween(@Param("f") Instant f, @Param("t") Instant t);
}
