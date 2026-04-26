package com.processor.core.model;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * One row parsed from a batch file before domain validation. The card number
 * is still a digit string; {@link com.processor.core.service.TransactionProcessorService}
 * masks it.
 */
public record ParsedFileRow(
        int rowNumber,
        String cardNumberDigits,
        String cardholderName,
        BigDecimal amount,
        String currency,
        Instant occurredAt
) {
}
