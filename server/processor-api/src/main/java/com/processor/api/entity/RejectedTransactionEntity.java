package com.processor.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity representing a rejected transaction row.
 * Managed by the persistence layer only. MUST NOT travel outside the adapter package.
 *
 * <p>As with {@link TransactionEntity}, the full PAN is never persisted —
 * only first4 / last4 are retained for diagnostics. The original raw row may be
 * stored under {@code rawPayload} (JSONB) by future ingest code.
 */
@Entity
@Table(name = "rejected_transactions")
public class RejectedTransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "batch_id")
    private UUID batchId;

    @Column(name = "source", nullable = false, length = 16)
    private String source;

    @Column(name = "row_number")
    private Integer rowNumber;

    @Column(name = "card_first4", length = 4)
    private String cardFirst4;

    @Column(name = "card_last4", length = 4)
    private String cardLast4;

    @Column(name = "cardholder_name", length = 120)
    private String cardholderName;

    @Column(name = "amount", precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "currency", length = 3)
    private String currency;

    @Column(name = "occurred_at")
    private Instant occurredAt;

    @Column(name = "external_reference", length = 64)
    private String externalReference;

    @Column(name = "reason_code", nullable = false, length = 32)
    private String reasonCode;

    @Column(name = "reason_message")
    private String reasonMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    protected RejectedTransactionEntity() {
        // JPA
    }

    public UUID getId() {
        return id;
    }

    public UUID getBatchId() {
        return batchId;
    }

    public String getSource() {
        return source;
    }

    public Integer getRowNumber() {
        return rowNumber;
    }

    public String getCardFirst4() {
        return cardFirst4;
    }

    public String getCardLast4() {
        return cardLast4;
    }

    public String getCardholderName() {
        return cardholderName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public String getExternalReference() {
        return externalReference;
    }

    public String getReasonCode() {
        return reasonCode;
    }

    public String getReasonMessage() {
        return reasonMessage;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }
}
