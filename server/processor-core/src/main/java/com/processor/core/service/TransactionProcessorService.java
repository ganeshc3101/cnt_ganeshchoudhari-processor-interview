package com.processor.core.service;

import com.processor.core.model.Transaction;
import com.processor.core.repository.TransactionRepository;
import com.processor.core.validator.CardValidator;

import java.util.List;
import java.util.Objects;

/**
 * Domain service — accepts, validates, and persists transactions.
 * Contains all business rules. MUST NOT depend on Spring/JPA/DB types.
 * Wired as a bean by processor-api AppConfig via constructor injection.
 */
public final class TransactionProcessorService {

    private final TransactionRepository transactionRepository;
    private final CardValidator cardValidator;

    public TransactionProcessorService(
            TransactionRepository transactionRepository,
            CardValidator cardValidator) {
        this.transactionRepository = Objects.requireNonNull(transactionRepository, "transactionRepository");
        this.cardValidator = Objects.requireNonNull(cardValidator, "cardValidator");
    }

    /**
     * Accept a single transaction, apply business rules, and persist.
     * Implementation intentionally omitted in the skeleton.
     */
    public Transaction accept(Transaction input) {
        throw new UnsupportedOperationException("TransactionProcessorService#accept is not implemented yet");
    }

    /**
     * Accept a batch of transactions atomically at the domain level.
     * Implementation intentionally omitted in the skeleton.
     */
    public List<Transaction> acceptBatch(List<Transaction> input) {
        throw new UnsupportedOperationException("TransactionProcessorService#acceptBatch is not implemented yet");
    }
}
