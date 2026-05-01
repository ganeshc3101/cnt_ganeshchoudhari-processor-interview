package com.processor.api.controller;

import com.processor.api.dto.BatchUploadResultDto;
import com.processor.api.dto.PageResponseDto;
import com.processor.api.dto.TransactionRequestDto;
import com.processor.api.dto.TransactionResponseDto;
import com.processor.api.service.TransactionApplicationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionApplicationService transactionApplicationService;

    public TransactionController(TransactionApplicationService transactionApplicationService) {
        this.transactionApplicationService = transactionApplicationService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('TRANSACTIONS_WRITE')")
    public ResponseEntity<List<TransactionResponseDto>> create(
            @Valid @RequestBody @NotEmpty List<@Valid TransactionRequestDto> requests) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transactionApplicationService.createManualMany(requests));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('TRANSACTIONS_READ')")
    public ResponseEntity<TransactionResponseDto> getById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(transactionApplicationService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('TRANSACTIONS_READ')")
    public ResponseEntity<PageResponseDto<TransactionResponseDto>> list(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false) List<String> cardBrands,
            @RequestParam(required = false) String minAmount,
            @RequestParam(required = false) String maxAmount,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<String> brands = cardBrands != null ? cardBrands : Collections.emptyList();
        return ResponseEntity.ok(
                transactionApplicationService.list(from, to, brands, minAmount, maxAmount, page, size));
    }

    @PostMapping(value = "/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('BATCHES_WRITE')")
    public ResponseEntity<BatchUploadResultDto> uploadBatch(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "format", defaultValue = "csv") String format) throws IOException {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(transactionApplicationService.uploadBatch(format, file));
    }
}
