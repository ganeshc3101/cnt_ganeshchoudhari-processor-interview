package com.processor.core.model;

import java.util.UUID;

/**
 * Minimal user projection for login — {@code passwordHash} is the
 * <strong>stored BCrypt (or equivalent) one-way string</strong> from the database.
 * Verify in the API with {@code PasswordEncoder.matches(plain, passwordHash)} (plain first, DB hash second).
 * Never log or return this type to HTTP.
 */
public record UserForAuthentication(
    UUID id,
    String username,
    String email,
    String status,
    String passwordHash
) {
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }
}
