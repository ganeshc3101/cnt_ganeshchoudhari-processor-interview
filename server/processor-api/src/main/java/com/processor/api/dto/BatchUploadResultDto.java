package com.processor.api.dto;

public record BatchUploadResultDto(
        String batchId,
        int totalRows,
        int acceptedRows,
        int rejectedRows,
        String status
) {
}
