package com.processor.api.mapper;

import com.processor.api.dto.TransactionRequestDto;
import com.processor.api.dto.TransactionResponseDto;
import com.processor.api.entity.RejectedTransactionEntity;
import com.processor.api.entity.TransactionEntity;
import com.processor.core.model.RejectedTransaction;
import com.processor.core.model.Transaction;
import org.springframework.stereotype.Component;

/**
 * Conversion between DTO ↔ Domain and Domain ↔ JPA Entity.
 * All mapping between the three representations is centralised here.
 */
@Component
public class TransactionMapper {

    public Transaction toDomain(TransactionRequestDto dto) {
        throw new UnsupportedOperationException("TransactionMapper#toDomain(TransactionRequestDto) is not implemented yet");
    }

    public TransactionResponseDto toResponse(Transaction transaction) {
        throw new UnsupportedOperationException("TransactionMapper#toResponse is not implemented yet");
    }

    public Transaction toDomain(TransactionEntity entity) {
        throw new UnsupportedOperationException("TransactionMapper#toDomain(TransactionEntity) is not implemented yet");
    }

    public TransactionEntity toEntity(Transaction transaction) {
        throw new UnsupportedOperationException("TransactionMapper#toEntity is not implemented yet");
    }

    public RejectedTransaction toDomain(RejectedTransactionEntity entity) {
        throw new UnsupportedOperationException("TransactionMapper#toDomain(RejectedTransactionEntity) is not implemented yet");
    }

    public RejectedTransactionEntity toEntity(RejectedTransaction rejected) {
        throw new UnsupportedOperationException("TransactionMapper#toEntity(RejectedTransaction) is not implemented yet");
    }
}
