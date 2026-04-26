package com.processor.api.repository;

import com.processor.api.entity.TransactionBatchEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface JpaTransactionBatchRepository extends JpaRepository<TransactionBatchEntity, UUID> {
}
