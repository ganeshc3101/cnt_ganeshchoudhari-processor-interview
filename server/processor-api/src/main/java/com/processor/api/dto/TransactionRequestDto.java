package com.processor.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Inbound request DTO for creating a manual transaction.
 * Boundary type — MUST NOT enter processor-core.
 *
 * <p>The full PAN is accepted here for one reason only: the server needs it to
 * derive {@code card_first4} + {@code card_last4} + {@code card_brand}. It MUST be
 * discarded immediately after derivation and MUST NOT be logged or persisted.
 *
 * <p>{@code amount} may be negative (chargebacks / reversals).
 */
public record TransactionRequestDto(
        @Size(max = 120) String cardholderName,
        @NotBlank @Pattern(regexp = "\\d{12,19}") String cardNumber,
        @NotNull BigDecimal amount,
        @NotBlank @Size(min = 3, max = 3) String currency,
        Instant timestamp
) {
}
