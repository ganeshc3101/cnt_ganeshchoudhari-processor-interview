package com.processor.api.controller;

import com.processor.api.dto.TransactionRequestDto;
import com.processor.api.dto.TransactionResponseDto;
import com.processor.api.service.TransactionApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for transactions.
 * MUST NOT contain business logic. Only parsing, validation, and delegation.
 */
@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionApplicationService transactionApplicationService;

    public TransactionController(TransactionApplicationService transactionApplicationService) {
        this.transactionApplicationService = transactionApplicationService;
    }

    @PostMapping
    public ResponseEntity<TransactionResponseDto> create(@Valid @RequestBody TransactionRequestDto request) {
        throw new UnsupportedOperationException("TransactionController#create is not implemented yet");
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponseDto> getById(@PathVariable String id) {
        throw new UnsupportedOperationException("TransactionController#getById is not implemented yet");
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponseDto>> list() {
        throw new UnsupportedOperationException("TransactionController#list is not implemented yet");
    }
}
