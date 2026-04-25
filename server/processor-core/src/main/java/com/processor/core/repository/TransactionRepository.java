package com.processor.core.repository;

import com.processor.core.model.RejectedTransaction;
import com.processor.core.model.Transaction;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository port (interface) for transaction persistence.
 * Implementations live in processor-api and MUST map between domain models and JPA entities.
 * This interface MUST NOT reference Spring, JPA, or SQL types.
 */
public interface TransactionRepository {

    Transaction save(Transaction transaction);

    Optional<Transaction> findById(UUID id);

    List<Transaction> findAll();

    RejectedTransaction saveRejected(RejectedTransaction rejected);

    List<RejectedTransaction> findAllRejected();
}
