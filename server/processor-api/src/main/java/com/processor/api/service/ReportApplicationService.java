package com.processor.api.service;

import com.processor.api.dto.CardBrandStatsDto;
import com.processor.api.dto.DailyVolumePointDto;
import com.processor.api.dto.DashboardMetricsDto;
import com.processor.core.model.DailyVolumePoint;
import com.processor.core.model.DashboardMetrics;
import com.processor.core.service.ReportingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ReportApplicationService {

    private final ReportingService reportingService;
    private final DateRangeService dateRangeService;

    public ReportApplicationService(ReportingService reportingService, DateRangeService dateRangeService) {
        this.reportingService = reportingService;
        this.dateRangeService = dateRangeService;
    }

    @Transactional(readOnly = true)
    public DashboardMetricsDto metrics(Instant from, Instant to) {
        Instant f = dateRangeService.fromOrDefault(from);
        Instant t = dateRangeService.toOrDefault(to);
        if (!f.isBefore(t)) {
            throw new com.processor.core.exception.ProcessingException("VALIDATION", "'from' must be before 'to'");
        }
        DashboardMetrics m = reportingService.dashboardMetrics(f, t);
        return new DashboardMetricsDto(
                m.totalTransactionCount(),
                m.acceptedCount(),
                m.rejectedCount(),
                m.totalVolumeAccepted(),
                m.averageAmountAccepted()
        );
    }

    @Transactional(readOnly = true)
    public List<DailyVolumePointDto> dailyVolume(Instant from, Instant to) {
        Instant f = dateRangeService.fromOrDefault(from);
        Instant t = dateRangeService.toOrDefault(to);
        if (!f.isBefore(t)) {
            throw new com.processor.core.exception.ProcessingException("VALIDATION", "'from' must be before 'to'");
        }
        List<DailyVolumePoint> p = reportingService.dailyAcceptedVolume(f, t);
        return p.stream()
                .map(d -> new DailyVolumePointDto(d.day(), d.transactionCount(), d.totalVolume()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CardBrandStatsDto> cardDistribution(Instant from, Instant to) {
        Instant f = dateRangeService.fromOrDefault(from);
        Instant t = dateRangeService.toOrDefault(to);
        if (!f.isBefore(t)) {
            throw new com.processor.core.exception.ProcessingException("VALIDATION", "'from' must be before 'to'");
        }
        return reportingService.cardDistribution(f, t).stream()
                .map(s -> new CardBrandStatsDto(s.brand().name(), s.count(), s.totalVolume()))
                .toList();
    }
}
