package com.processor.api.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Optional<UUID> currentUserId() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || !a.isAuthenticated()) {
            return Optional.empty();
        }
        Object p = a.getPrincipal();
        if (p == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(UUID.fromString(p.toString()));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
