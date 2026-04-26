package com.processor.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ActivityLogResponseDto(
        String id,
        String userId,
        String username,
        String action,
        String resourceType,
        String resourceId,
        String status,
        String message,
        Map<String, Object> metadata,
        Instant createdAt
) {
}
