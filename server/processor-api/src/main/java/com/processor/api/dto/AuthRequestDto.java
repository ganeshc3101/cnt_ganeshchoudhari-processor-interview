package com.processor.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Credentials for the login endpoint.
 * Boundary type — MUST NOT enter processor-core.
 */
public record AuthRequestDto(
        @NotBlank @Size(max = 254) String username,
        @NotBlank @Size(min = 12, max = 128) String password
) {
}
