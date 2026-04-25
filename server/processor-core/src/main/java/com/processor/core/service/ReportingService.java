package com.processor.core.service;

import com.processor.core.model.Transaction;
import com.processor.core.repository.TransactionRepository;

import java.util.List;
import java.util.Objects;

/**
 * Domain service — produces summaries and analytics from stored transactions.
 * MUST NOT depend on Spring/JPA/DB types.
 */
public final class ReportingService {

    private final TransactionRepository transactionRepository;

    public ReportingService(TransactionRepository transactionRepository) {
        this.transactionRepository = Objects.requireNonNull(transactionRepository, "transactionRepository");
    }

    /**
     * Returns all transactions. Concrete reporting queries will replace this
     * with aggregates (by brand, by day, totals, etc.) in a later phase.
     */
    public List<Transaction> listAll() {
        throw new UnsupportedOperationException("ReportingService#listAll is not implemented yet");
    }
}
