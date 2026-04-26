package com.processor.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorDto(
        String code,
        String message,
        String traceId,
        Object details
) {
}
