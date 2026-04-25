package com.processor.api.dto;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Outbound response DTO describing a stored transaction.
 * Boundary type — MUST NOT enter processor-core.
 *
 * <p>{@code cardFirst4} / {@code cardLast4} are the only PAN digits ever returned.
 * Clients must format display strings (e.g. {@code 4242 •••• •••• 4242}) themselves.
 */
public record TransactionResponseDto(
        String id,
        String batchId,
        String source,
        String cardFirst4,
        String cardLast4,
        String cardBrand,
        String cardholderName,
        BigDecimal amount,
        String currency,
        Instant occurredAt,
        Instant createdAt
) {
}
