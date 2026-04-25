package com.processor.api.repository;

import com.processor.api.mapper.TransactionMapper;
import com.processor.core.model.RejectedTransaction;
import com.processor.core.model.Transaction;
import com.processor.core.repository.TransactionRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Adapter implementing the core TransactionRepository port.
 * Bridges domain models and JPA entities. JPA types stop at this boundary.
 */
@Repository
public class TransactionRepositoryImpl implements TransactionRepository {

    private final JpaTransactionRepository jpaTransactionRepository;
    private final JpaRejectedTransactionRepository jpaRejectedTransactionRepository;
    private final TransactionMapper transactionMapper;

    public TransactionRepositoryImpl(
            JpaTransactionRepository jpaTransactionRepository,
            JpaRejectedTransactionRepository jpaRejectedTransactionRepository,
            TransactionMapper transactionMapper) {
        this.jpaTransactionRepository = jpaTransactionRepository;
        this.jpaRejectedTransactionRepository = jpaRejectedTransactionRepository;
        this.transactionMapper = transactionMapper;
    }

    @Override
    public Transaction save(Transaction transaction) {
        throw new UnsupportedOperationException("TransactionRepositoryImpl#save is not implemented yet");
    }

    @Override
    public Optional<Transaction> findById(UUID id) {
        throw new UnsupportedOperationException("TransactionRepositoryImpl#findById is not implemented yet");
    }

    @Override
    public List<Transaction> findAll() {
        throw new UnsupportedOperationException("TransactionRepositoryImpl#findAll is not implemented yet");
    }

    @Override
    public RejectedTransaction saveRejected(RejectedTransaction rejected) {
        throw new UnsupportedOperationException("TransactionRepositoryImpl#saveRejected is not implemented yet");
    }

    @Override
    public List<RejectedTransaction> findAllRejected() {
        throw new UnsupportedOperationException("TransactionRepositoryImpl#findAllRejected is not implemented yet");
    }
}
