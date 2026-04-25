package com.processor.core.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Domain model for a transaction that failed validation/processing.
 * Captures the original (safely masked) input plus the rejection reason.
 *
 * <p>Full card numbers are never stored. Only {@code cardFirst4}/{@code cardLast4}
 * are retained; the original raw row may be kept under {@code rawPayload} for
 * debugging by operators, but never the PAN itself.
 */
public record RejectedTransaction(
        UUID id,
        UUID batchId,
        TransactionSource source,
        Integer rowNumber,
        String cardFirst4,
        String cardLast4,
        String cardholderName,
        BigDecimal amount,
        String currency,
        Instant occurredAt,
        String reasonCode,
        String reasonMessage,
        String rawPayload,
        UUID createdBy,
        Instant createdAt
) {
}
