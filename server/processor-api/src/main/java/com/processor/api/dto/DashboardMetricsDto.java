package com.processor.api.dto;

import java.math.BigDecimal;

public record DashboardMetricsDto(
        long totalTransactionCount,
        long acceptedCount,
        long rejectedCount,
        BigDecimal totalVolumeAccepted,
        BigDecimal averageAmountAccepted
) {
}
