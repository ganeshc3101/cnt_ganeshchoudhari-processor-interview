package com.processor.core.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * In-memory command to ingest a single transaction. The raw card number is
 * validated and immediately converted to first/last four + brand — the full PAN
 * must never be stored or returned in domain {@link Transaction}.
 */
public record NewTransactionCommand(
        UUID batchId,
        TransactionSource source,
        Integer rowNumber,
        String cardNumberRawDigits,
        String cardholderName,
        BigDecimal amount,
        String currency,
        Instant occurredAt,
        UUID createdBy
) {
}
