package com.processor.core.model;

import java.util.List;
import java.util.UUID;

/**
 * Public-safe user profile (no password / hash).
 */
public record UserProfile(
        UUID id,
        String username,
        String email,
        String firstName,
        String lastName,
        String displayName,
        String status,
        List<String> roleCodes,
        List<String> permissionCodes
) {
}
