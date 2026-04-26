package com.processor.core.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;

public record TransactionListQuery(
        Instant fromOccurredAt,
        Instant toOccurredAt,
        Set<CardBrand> cardBrands,
        BigDecimal minAmount,
        BigDecimal maxAmount,
        int page,
        int size
) {
    public int safePage() {
        return Math.max(0, page);
    }

    public int safeSize() {
        int s = size <= 0 ? 20 : Math.min(size, 200);
        return s;
    }
}
