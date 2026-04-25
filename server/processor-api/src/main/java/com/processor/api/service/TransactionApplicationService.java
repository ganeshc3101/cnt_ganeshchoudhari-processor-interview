package com.processor.api.service;

import com.processor.api.dto.TransactionRequestDto;
import com.processor.api.dto.TransactionResponseDto;
import com.processor.api.mapper.TransactionMapper;
import com.processor.core.repository.TransactionRepository;
import com.processor.core.service.TransactionProcessorService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Application (use-case) service for transactions.
 * Orchestrates mapping and delegates business rules to the core domain service.
 * MUST NOT contain business rules.
 */
@Service
public class TransactionApplicationService {

    private final TransactionProcessorService transactionProcessorService;
    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;

    public TransactionApplicationService(
            TransactionProcessorService transactionProcessorService,
            TransactionRepository transactionRepository,
            TransactionMapper transactionMapper) {
        this.transactionProcessorService = transactionProcessorService;
        this.transactionRepository = transactionRepository;
        this.transactionMapper = transactionMapper;
    }

    @Transactional
    public TransactionResponseDto create(TransactionRequestDto request) {
        throw new UnsupportedOperationException("TransactionApplicationService#create is not implemented yet");
    }

    @Transactional(readOnly = true)
    public TransactionResponseDto getById(String id) {
        throw new UnsupportedOperationException("TransactionApplicationService#getById is not implemented yet");
    }

    @Transactional(readOnly = true)
    public List<TransactionResponseDto> list() {
        throw new UnsupportedOperationException("TransactionApplicationService#list is not implemented yet");
    }
}
