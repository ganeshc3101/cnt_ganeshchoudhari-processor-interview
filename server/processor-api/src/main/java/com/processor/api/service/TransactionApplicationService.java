package com.processor.api.service;

import com.processor.api.entity.TransactionBatchEntity;
import com.processor.api.mapper.TransactionMapper;
import com.processor.api.repository.JpaTransactionBatchRepository;
import com.processor.core.exception.ProcessingException;
import com.processor.core.model.CardBrand;
import com.processor.core.model.NewTransactionCommand;
import com.processor.core.model.ParsedFileRow;
import com.processor.core.model.PageResult;
import com.processor.core.model.ProcessResult;
import com.processor.core.model.Transaction;
import com.processor.core.model.TransactionListQuery;
import com.processor.core.model.TransactionSource;
import com.processor.core.parser.TransactionFileParser;
import com.processor.core.repository.TransactionRepository;
import com.processor.core.service.TransactionProcessorService;
import com.processor.api.dto.PageResponseDto;
import com.processor.api.dto.TransactionRequestDto;
import com.processor.api.dto.TransactionResponseDto;
import com.processor.api.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Application (use-case) service for transactions. Orchestrates domain + mapping; no business rules.
 */
@Service
public class TransactionApplicationService {

    private final TransactionProcessorService transactionProcessorService;
    private final TransactionRepository transactionRepository;
    private final TransactionMapper transactionMapper;
    private final Clock clock;
    private final JpaTransactionBatchRepository batchRepository;
    private final TransactionFileParser transactionFileParser;
    private final com.processor.api.batch.JsonBatchReader jsonBatchReader;
    private final DateRangeService dateRangeService;

    public TransactionApplicationService(
            TransactionProcessorService transactionProcessorService,
            TransactionRepository transactionRepository,
            TransactionMapper transactionMapper,
            Clock clock,
            JpaTransactionBatchRepository batchRepository,
            TransactionFileParser transactionFileParser,
            com.processor.api.batch.JsonBatchReader jsonBatchReader,
            DateRangeService dateRangeService) {
        this.transactionProcessorService = transactionProcessorService;
        this.transactionRepository = transactionRepository;
        this.transactionMapper = transactionMapper;
        this.clock = clock;
        this.batchRepository = batchRepository;
        this.transactionFileParser = transactionFileParser;
        this.jsonBatchReader = jsonBatchReader;
        this.dateRangeService = dateRangeService;
    }

    /**
     * Creates one or more manual transactions in a single transaction (all succeed or all roll back).
     */
    @Transactional
    public List<TransactionResponseDto> createManualMany(List<TransactionRequestDto> requests) {
        List<TransactionResponseDto> created = new ArrayList<>(requests.size());
        for (TransactionRequestDto request : requests) {
            created.add(createManualOne(request));
        }
        return created;
    }

    private TransactionResponseDto createManualOne(TransactionRequestDto request) {
        UUID userId = SecurityUtils.currentUserId().orElseThrow(() -> new ProcessingException("AUTH", "Not authenticated"));
        var cmd = new NewTransactionCommand(
                null,
                TransactionSource.MANUAL,
                null,
                request.cardNumber().replaceAll("\\D", ""),
                request.cardholderName(),
                request.amount(),
                request.currency(),
                request.timestamp() != null ? request.timestamp() : clock.instant(),
                userId
        );
        ProcessResult result = transactionProcessorService.process(cmd);
        if (result.rejected().isPresent()) {
            var r = result.rejected().get();
            throw new ProcessingException(r.reasonCode(), r.reasonMessage());
        }
        return transactionMapper.toResponse(result.accepted().orElseThrow());
    }

    @Transactional(readOnly = true)
    public TransactionResponseDto getById(UUID id) {
        return transactionRepository.findById(id)
                .map(transactionMapper::toResponse)
                .orElseThrow(() -> new ProcessingException("NOT_FOUND", "Transaction not found"));
    }

    @Transactional(readOnly = true)
    public PageResponseDto<TransactionResponseDto> list(
            Instant from,
            Instant to,
            List<String> cardBrands,
            String minAmount,
            String maxAmount,
            int page,
            int size) {
        Instant f = dateRangeService.fromOrDefault(from);
        Instant t = dateRangeService.toOrDefault(to);
        if (!f.isBefore(t)) {
            throw new ProcessingException("VALIDATION", "'from' must be before 'to'");
        }
        Set<CardBrand> brands;
        if (cardBrands != null && !cardBrands.isEmpty()) {
            try {
                brands = cardBrands.stream()
                        .map(s -> CardBrand.valueOf(s.trim().toUpperCase()))
                        .collect(Collectors.toCollection(() -> EnumSet.noneOf(CardBrand.class)));
            } catch (IllegalArgumentException e) {
                throw new ProcessingException("VALIDATION", "Invalid card brand value");
            }
        } else {
            brands = null;
        }
        BigDecimal min = null;
        BigDecimal max = null;
        if (minAmount != null && !minAmount.isBlank()) {
            min = new BigDecimal(minAmount);
        }
        if (maxAmount != null && !maxAmount.isBlank()) {
            max = new BigDecimal(maxAmount);
        }
        TransactionListQuery q = new TransactionListQuery(
                f, t, brands, min, max, page, size);
        PageResult<Transaction> p = transactionRepository.findTransactions(q);
        List<TransactionResponseDto> content = p.content().stream()
                .map(transactionMapper::toResponse)
                .toList();
        return new PageResponseDto<>(
                content, p.page(), p.size(), p.totalElements(), p.totalPages());
    }

    @Transactional
    public com.processor.api.dto.BatchUploadResultDto uploadBatch(String format, MultipartFile file) throws IOException {
        UUID userId = SecurityUtils.currentUserId().orElseThrow(() -> new ProcessingException("AUTH", "Not authenticated"));
        if (file == null || file.isEmpty()) {
            throw new ProcessingException("FILE", "File is required");
        }
        String fmt = format == null || format.isBlank() ? "csv" : format.trim().toLowerCase();
        List<ParsedFileRow> rows;
        if ("json".equals(fmt)) {
            rows = jsonBatchReader.read(file.getInputStream());
        } else if ("csv".equals(fmt)) {
            rows = transactionFileParser.parse("csv", file.getInputStream());
        } else {
            throw new ProcessingException("FORMAT", "Support csv and json in this release");
        }

        TransactionBatchEntity batch = new TransactionBatchEntity();
        batch.setSource("BATCH");
        batch.setFileName(file.getOriginalFilename());
        batch.setFileFormat(fmt.toUpperCase());
        batch.setFileSizeBytes(file.getSize());
        batch.setStatus("PROCESSING");
        batch.setTotalRows(rows.size());
        batch.setCreatedAt(Instant.now());
        batch.setUpdatedAt(Instant.now());
        batch.setCreatedBy(userId);
        batch = batchRepository.save(batch);
        final UUID batchId = batch.getId();

        int accepted = 0;
        int rejected = 0;
        for (ParsedFileRow row : rows) {
            var cmd = new NewTransactionCommand(
                    batchId,
                    TransactionSource.BATCH,
                    row.rowNumber(),
                    row.cardNumberDigits().replaceAll("\\D", ""),
                    row.cardholderName(),
                    row.amount(),
                    row.currency(),
                    row.occurredAt(),
                    userId
            );
            ProcessResult pr = transactionProcessorService.process(cmd);
            if (pr.accepted().isPresent()) {
                accepted++;
            } else {
                rejected++;
            }
        }
        batch.setAcceptedRows(accepted);
        batch.setRejectedRows(rejected);
        batch.setStatus("COMPLETED");
        batch.setProcessedAt(Instant.now());
        batch.setUpdatedAt(Instant.now());
        batchRepository.save(batch);
        return new com.processor.api.dto.BatchUploadResultDto(
                batchId.toString(), rows.size(), accepted, rejected, "COMPLETED");
    }
}
