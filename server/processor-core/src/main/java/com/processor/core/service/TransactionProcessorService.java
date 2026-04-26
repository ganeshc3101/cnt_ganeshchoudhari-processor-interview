package com.processor.core.service;

import com.processor.core.model.CardBrand;
import com.processor.core.model.NewTransactionCommand;
import com.processor.core.model.ProcessResult;
import com.processor.core.model.RejectedTransaction;
import com.processor.core.model.Transaction;
import com.processor.core.model.TransactionSource;
import com.processor.core.repository.TransactionRepository;
import com.processor.core.validator.CardValidator;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Domain service — validates card data and persists accepted or rejected rows.
 * MUST NOT depend on Spring/JPA/DB types.
 */
public final class TransactionProcessorService {

    private final TransactionRepository transactionRepository;
    private final CardValidator cardValidator;

    public TransactionProcessorService(
            TransactionRepository transactionRepository,
            CardValidator cardValidator) {
        this.transactionRepository = Objects.requireNonNull(transactionRepository, "transactionRepository");
        this.cardValidator = Objects.requireNonNull(cardValidator, "cardValidator");
    }

    /**
     * Validates, masks PAN to first/last four + brand, persists one accepted or one rejected row.
     */
    public ProcessResult process(NewTransactionCommand command) {
        String digits = cardValidator.normalizeToDigits(command.cardNumberRawDigits());
        Instant occurredAt = command.occurredAt() != null ? command.occurredAt() : Instant.now();
        String currency = command.currency() != null && !command.currency().isBlank()
                ? command.currency().trim().toUpperCase()
                : "USD";

        if (command.amount() == null) {
            return storeRejected(
                    command,
                    digits,
                    occurredAt,
                    currency,
                    "MISSING_FIELD",
                    "Amount is required");
        }

        if (digits.length() < 12) {
            return storeRejected(
                    command,
                    digits,
                    occurredAt,
                    currency,
                    "MISSING_FIELD",
                    "Card number is too short");
        }

        if (!cardValidator.isValid(digits)) {
            String code = "LUHN_FAIL";
            String message = "Card number failed Luhn check";
            if (digits.length() >= 1) {
                char f = digits.charAt(0);
                if (f < '3' || f > '6' || cardValidator.resolveBrand(digits).isEmpty()) {
                    code = "INVALID_CARD_BRAND";
                    message = "Card brand is not supported (use Amex, Visa, MasterCard, or Discover)";
                }
            }
            return storeRejected(command, digits, occurredAt, currency, code, message);
        }

        CardBrand brand = cardValidator.resolveBrand(digits)
                .orElseThrow(() -> new IllegalStateException("isValid was true but brand is empty"));

        String first4 = cardValidator.first4(digits);
        String last4 = cardValidator.last4(digits);
        Instant now = Instant.now();

        Transaction toSave = new Transaction(
                UUID.randomUUID(),
                command.batchId(),
                command.source(),
                first4,
                last4,
                brand,
                command.cardholderName(),
                command.amount(),
                currency,
                occurredAt,
                command.createdBy(),
                now
        );
        Transaction saved = transactionRepository.save(toSave);
        return ProcessResult.success(saved);
    }

    public List<Transaction> processBatchRows(List<NewTransactionCommand> rows) {
        return rows.stream()
                .map(this::process)
                .flatMap(r -> r.accepted().stream())
                .toList();
    }

    private ProcessResult storeRejected(
            NewTransactionCommand command,
            String digits,
            Instant occurredAt,
            String currency,
            String reasonCode,
            String reasonMessage) {
        String f4 = digits.length() >= 4 ? cardValidator.first4(digits) : null;
        String l4 = digits.length() >= 4 ? cardValidator.last4(digits) : null;
        Instant now = Instant.now();
        RejectedTransaction r = new RejectedTransaction(
                UUID.randomUUID(),
                command.batchId(),
                command.source() != null ? command.source() : TransactionSource.MANUAL,
                command.rowNumber(),
                f4,
                l4,
                command.cardholderName(),
                command.amount(),
                currency,
                occurredAt,
                reasonCode,
                reasonMessage,
                null,
                command.createdBy(),
                now
        );
        RejectedTransaction saved = transactionRepository.saveRejected(r);
        return ProcessResult.failed(saved);
    }
}
