package com.processor.core.service;

import com.processor.core.model.CardBrandStats;
import com.processor.core.model.DailyVolumePoint;
import com.processor.core.model.DashboardMetrics;
import com.processor.core.repository.TransactionRepository;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

/**
 * Domain-facing reporting facade over the transaction repository.
 */
public final class ReportingService {

    private final TransactionRepository transactionRepository;

    public ReportingService(TransactionRepository transactionRepository) {
        this.transactionRepository = Objects.requireNonNull(transactionRepository, "transactionRepository");
    }

    public DashboardMetrics dashboardMetrics(Instant from, Instant to) {
        return transactionRepository.metrics(from, to);
    }

    public List<DailyVolumePoint> dailyAcceptedVolume(Instant from, Instant to) {
        return transactionRepository.dailyAcceptedVolume(from, to);
    }

    public List<CardBrandStats> cardDistribution(Instant from, Instant to) {
        return transactionRepository.cardBrandDistribution(from, to);
    }
}
