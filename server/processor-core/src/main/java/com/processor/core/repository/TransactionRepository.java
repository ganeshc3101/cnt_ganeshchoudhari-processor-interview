package com.processor.core.repository;

import com.processor.core.model.CardBrandStats;
import com.processor.core.model.DailyVolumePoint;
import com.processor.core.model.DashboardMetrics;
import com.processor.core.model.PageResult;
import com.processor.core.model.RejectedTransaction;
import com.processor.core.model.Transaction;
import com.processor.core.model.TransactionListQuery;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository port (interface) for transaction persistence and reporting aggregates.
 * Implementations live in processor-api. MUST NOT reference Spring or JPA types.
 */
public interface TransactionRepository {

    Transaction save(Transaction transaction);

    Optional<Transaction> findById(UUID id);

    PageResult<Transaction> findTransactions(TransactionListQuery query);

    RejectedTransaction saveRejected(RejectedTransaction rejected);

    DashboardMetrics metrics(Instant fromExclusive, Instant toInclusive);

    List<DailyVolumePoint> dailyAcceptedVolume(Instant fromExclusive, Instant toInclusive);

    List<CardBrandStats> cardBrandDistribution(Instant fromExclusive, Instant toInclusive);
}
