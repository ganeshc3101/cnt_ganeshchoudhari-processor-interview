package com.processor.core.model;

import java.math.BigDecimal;

/**
 * Report snapshot for a time window. "Volume" is the sum of {@code amount} for accepted rows.
 * Total transactions = accepted + rejected in range.
 */
public record DashboardMetrics(
        long totalTransactionCount,
        long acceptedCount,
        long rejectedCount,
        BigDecimal totalVolumeAccepted,
        BigDecimal averageAmountAccepted
) {
}
