package com.processor.api.dto;

/**
 * Token payload returned by a successful authentication.
 * Boundary type — MUST NOT enter processor-core.
 */
public record AuthResponseDto(
        String tokenType,
        String accessToken,
        long expiresIn
) {
}
