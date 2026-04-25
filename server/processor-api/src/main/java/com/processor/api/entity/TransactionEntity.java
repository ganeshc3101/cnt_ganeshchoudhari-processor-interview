package com.processor.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity representing a persisted accepted transaction row.
 * Managed by the persistence layer only. MUST NOT travel outside the adapter package.
 *
 * <p>Card numbers are stored as {@code cardFirst4} + {@code cardLast4} only —
 * the full PAN is never persisted (see {@code 03_schema_transactions.sql}).
 * Amounts may be negative (reversals / chargebacks) — no positivity constraint.
 */
@Entity
@Table(name = "transactions")
public class TransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "batch_id")
    private UUID batchId;

    @Column(name = "source", nullable = false, length = 16)
    private String source;

    @Column(name = "card_first4", nullable = false, length = 4)
    private String cardFirst4;

    @Column(name = "card_last4", nullable = false, length = 4)
    private String cardLast4;

    @Column(name = "card_brand", nullable = false, length = 16)
    private String cardBrand;

    @Column(name = "cardholder_name", length = 120)
    private String cardholderName;

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "external_reference", length = 64)
    private String externalReference;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    protected TransactionEntity() {
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

    public String getCardFirst4() {
        return cardFirst4;
    }

    public String getCardLast4() {
        return cardLast4;
    }

    public String getCardBrand() {
        return cardBrand;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public UUID getUpdatedBy() {
        return updatedBy;
    }

    public long getVersion() {
        return version;
    }
}
