package com.processor.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record ActivityLogRequestDto(
        @NotBlank @Size(max = 64) @Pattern(regexp = "[A-Z0-9_]+") String action,
        @Size(max = 32) String resourceType,
        @Size(max = 2000) String message,
        Map<String, Object> metadata
) {
}
