package com.processor.api.util;

import org.springframework.lang.Nullable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;

/**
 * Verifies a plain-text password against a stored BCrypt (or other {@link PasswordEncoder})
 * <strong>hash string</strong> from the database.
 * <p>
 * Spring’s {@link PasswordEncoder#matches(CharSequence, String)} is defined as
 * {@code matches(rawPassword, encodedPasswordFromStorage)} — the <em>user-supplied</em> value
 * is always the first argument; the <em>persisted</em> one-way hash is the second. Do
 * <strong>not</strong> call {@code encode(plain)} here for comparison: BCrypt uses a per-hash
 * salt, so you must use {@code matches} only.
 */
public final class PasswordHashUtils {

    private PasswordHashUtils() {
    }

    /**
     * @param encoder           application {@link org.springframework.context.annotation.Bean} (e.g. {@link org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder})
     * @param rawPassword      password from the client (plain text, never pre-hashed)
     * @param storedEncodedHash value from {@code users.password_hash} (BCrypt from SQL {@code crypt(..., gen_salt('bf', ...))} or {@code passwordEncoder.encode})
     * @return true if the raw password matches the stored hash; false if inputs are null/blank
     */
    public static boolean matches(
            PasswordEncoder encoder,
            @Nullable CharSequence rawPassword,
            @Nullable String storedEncodedHash) {
        if (encoder == null) {
            throw new IllegalArgumentException("encoder is required");
        }
        if (!StringUtils.hasText(storedEncodedHash) || !StringUtils.hasText(rawPassword)) {
            return false;
        }
        return encoder.matches(rawPassword, storedEncodedHash);
    }
}
