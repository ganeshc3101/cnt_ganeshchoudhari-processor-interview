package com.processor.core.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Domain model representing a card transaction accepted into the system.
 * Immutable. Must remain free of Spring / JPA / framework annotations.
 *
 * <p>Card numbers are never carried in full — only the first four and last four
 * digits plus the derived brand. Amounts use {@link BigDecimal} and may be
 * negative (reversals / chargebacks).
 */
public record Transaction(
        UUID id,
        UUID batchId,
        TransactionSource source,
        String cardFirst4,
        String cardLast4,
        CardBrand cardBrand,
        String cardholderName,
        BigDecimal amount,
        String currency,
        Instant occurredAt,
        UUID createdBy,
        Instant createdAt
) {
}
