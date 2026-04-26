package com.processor.api.service;

import com.processor.api.dto.AuthRequestDto;
import com.processor.api.dto.AuthResponseDto;
import com.processor.api.dto.UserMeDto;
import com.processor.api.entity.AuthSessionEntity;
import com.processor.api.repository.JpaAuthSessionRepository;
import com.processor.api.security.JwtUtil;
import com.processor.api.util.PasswordHashUtils;
import com.processor.core.model.ActivityLogEntry;
import com.processor.core.model.UserForAuthentication;
import com.processor.core.model.UserProfile;
import com.processor.core.repository.ActivityLogRepository;
import com.processor.core.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JpaAuthSessionRepository authSessionRepository;
    private final ActivityLogRepository activityLogRepository;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            JpaAuthSessionRepository authSessionRepository,
            ActivityLogRepository activityLogRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authSessionRepository = authSessionRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @Transactional
    public AuthResponseDto login(AuthRequestDto request, HttpServletRequest http) {
        UserForAuthentication authUser = userRepository
                .findForAuthenticationByLoginName(request.username().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (!authUser.isActive()) {
            throw new DisabledException("Account is not active");
        }
        if (!PasswordHashUtils.matches(passwordEncoder, request.password(), authUser.passwordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        final UUID uid = authUser.id();

        UserProfile profile = userRepository.findProfileById(uid)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        String jti = jwtUtil.newJti();
        long ttl = jwtUtil.accessTokenTtlSeconds();
        String token = jwtUtil.createAccessToken(
                profile.id().toString(),
                jti,
                profile.roleCodes(),
                profile.permissionCodes()
        );
        persistSession(uid, jti, ttl, http);
        userRepository.updateLastLogin(uid, Instant.now());

        activityLogRepository.save(
                new ActivityLogEntry(
                        UUID.randomUUID(),
                        uid,
                        authUser.username(),
                        "AUTH_LOGIN",
                        "session",
                        null,
                        "SUCCESS",
                        "User signed in",
                        null,
                        Instant.now()
                )
        );
        return new AuthResponseDto("Bearer", token, ttl);
    }

    @Transactional
    public void logout(String bearerToken) {
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            return;
        }
        String token = bearerToken.substring(7).trim();
        try {
            String jti = jwtUtil.extractJti(token);
            authSessionRepository.findById(UUID.fromString(jti)).ifPresent(s -> {
                s.setRevokedAt(Instant.now());
                authSessionRepository.save(s);
            });
        } catch (Exception e) {
            // ignore; logout is idempotent
        }
    }

    @Transactional(readOnly = true)
    public UserMeDto me() {
        UUID id = com.processor.api.util.SecurityUtils.currentUserId()
                .orElseThrow(() -> new BadCredentialsException("Not authenticated"));
        UserProfile p = userRepository.findProfileById(id)
                .orElseThrow(() -> new BadCredentialsException("User not found"));
        return new UserMeDto(
                p.id().toString(),
                p.username(),
                p.email(),
                p.firstName(),
                p.lastName(),
                p.displayName(),
                p.status(),
                p.roleCodes(),
                p.permissionCodes()
        );
    }

    private void persistSession(UUID userId, String jti, long ttlSeconds, HttpServletRequest http) {
        Instant now = Instant.now();
        AuthSessionEntity s = new AuthSessionEntity();
        s.setId(UUID.fromString(jti));
        s.setUserId(userId);
        s.setIssuedAt(now);
        s.setExpiresAt(now.plusSeconds(ttlSeconds));
        s.setClientIp(extractClientIp(http));
        s.setUserAgent(http.getHeader("User-Agent"));
        s.setCreatedAt(now);
        authSessionRepository.save(s);
    }

    private static String extractClientIp(HttpServletRequest http) {
        String x = http.getHeader("X-Forwarded-For");
        if (x != null && !x.isBlank()) {
            return x.split(",")[0].trim();
        }
        return http.getRemoteAddr();
    }
}
