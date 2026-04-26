package com.processor.core.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ActivityLogEntry(
        UUID id,
        UUID userId,
        String username,
        String action,
        String resourceType,
        UUID resourceId,
        String status,
        String message,
        Map<String, Object> metadata,
        Instant createdAt
) {
}
