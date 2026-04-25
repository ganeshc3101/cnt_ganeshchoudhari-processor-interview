package com.processor.api.security;

import org.springframework.stereotype.Component;

/**
 * Placeholder for JWT issue/validate helpers.
 * Real implementation will wrap a signed-JWT library in a later phase.
 */
@Component
public class JwtUtil {

    public String issue(String subject) {
        throw new UnsupportedOperationException("JwtUtil#issue is not implemented yet");
    }

    public String extractSubject(String token) {
        throw new UnsupportedOperationException("JwtUtil#extractSubject is not implemented yet");
    }

    public boolean isValid(String token) {
        throw new UnsupportedOperationException("JwtUtil#isValid is not implemented yet");
    }
}
