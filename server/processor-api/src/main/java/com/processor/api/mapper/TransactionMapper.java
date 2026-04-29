package com.processor.api.mapper;

import com.processor.api.dto.TransactionResponseDto;
import com.processor.api.entity.RejectedTransactionEntity;
import com.processor.api.entity.TransactionEntity;
import com.processor.core.exception.ProcessingException;
import com.processor.core.model.CardBrand;
import com.processor.core.model.RejectedTransaction;
import com.processor.core.model.Transaction;
import com.processor.core.model.TransactionSource;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.UUID;

@Component
public class TransactionMapper {

    private static String normEnum(String raw) {
        return raw == null ? "" : raw.trim().toUpperCase(Locale.ROOT);
    }

    private static TransactionSource parseSource(String raw) {
        try {
            return TransactionSource.valueOf(normEnum(raw));
        } catch (IllegalArgumentException e) {
            throw new ProcessingException("CORRUPT_DATA", "Invalid transaction source stored in DB: " + raw);
        }
    }

    private static CardBrand parseCardBrand(String raw) {
        try {
            return CardBrand.valueOf(normEnum(raw));
        } catch (IllegalArgumentException e) {
            throw new ProcessingException("CORRUPT_DATA", "Invalid card brand stored in DB: " + raw);
        }
    }

    public TransactionResponseDto toResponse(Transaction t) {
        return new TransactionResponseDto(
                t.id() != null ? t.id().toString() : null,
                t.batchId() != null ? t.batchId().toString() : null,
                t.source() != null ? t.source().name() : null,
                t.cardFirst4(),
                t.cardLast4(),
                t.cardBrand() != null ? t.cardBrand().name() : null,
                t.cardholderName(),
                t.amount(),
                t.currency(),
                t.occurredAt(),
                t.createdAt()
        );
    }

    public Transaction toDomain(TransactionEntity e) {
        if (e == null) {
            return null;
        }
        return new Transaction(
                e.getId(),
                e.getBatchId(),
                parseSource(e.getSource()),
                e.getCardFirst4(),
                e.getCardLast4(),
                parseCardBrand(e.getCardBrand()),
                e.getCardholderName(),
                e.getAmount(),
                e.getCurrency(),
                e.getOccurredAt(),
                e.getCreatedBy(),
                e.getCreatedAt()
        );
    }

    public TransactionEntity toNewEntity(Transaction t) {
        TransactionEntity e = new TransactionEntity();
        e.setId(t.id());
        e.setBatchId(t.batchId());
        e.setSource(t.source().name());
        e.setCardFirst4(t.cardFirst4());
        e.setCardLast4(t.cardLast4());
        e.setCardBrand(t.cardBrand().name());
        e.setCardholderName(t.cardholderName());
        e.setAmount(t.amount());
        e.setCurrency(t.currency());
        e.setOccurredAt(t.occurredAt());
        e.setCreatedBy(t.createdBy());
        e.setCreatedAt(t.createdAt());
        e.setUpdatedAt(t.createdAt());
        return e;
    }

    public RejectedTransaction toDomain(RejectedTransactionEntity e) {
        if (e == null) {
            return null;
        }
        return new RejectedTransaction(
                e.getId(),
                e.getBatchId(),
                parseSource(e.getSource()),
                e.getRowNumber(),
                e.getCardFirst4(),
                e.getCardLast4(),
                e.getCardholderName(),
                e.getAmount(),
                e.getCurrency(),
                e.getOccurredAt(),
                e.getReasonCode(),
                e.getReasonMessage(),
                null,
                e.getCreatedBy(),
                e.getCreatedAt()
        );
    }

    public RejectedTransactionEntity toNewEntity(RejectedTransaction r) {
        RejectedTransactionEntity e = new RejectedTransactionEntity();
        e.setId(r.id());
        e.setBatchId(r.batchId());
        e.setSource(r.source().name());
        e.setRowNumber(r.rowNumber());
        e.setCardFirst4(r.cardFirst4());
        e.setCardLast4(r.cardLast4());
        e.setCardholderName(r.cardholderName());
        e.setAmount(r.amount());
        e.setCurrency(r.currency());
        e.setOccurredAt(r.occurredAt());
        e.setReasonCode(r.reasonCode());
        e.setReasonMessage(r.reasonMessage());
        e.setCreatedAt(r.createdAt());
        e.setUpdatedAt(r.createdAt());
        e.setCreatedBy(r.createdBy());
        return e;
    }

}
