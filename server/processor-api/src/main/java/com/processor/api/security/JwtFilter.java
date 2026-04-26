package com.processor.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.processor.api.dto.ApiErrorDto;
import com.processor.api.entity.AuthSessionEntity;
import com.processor.api.repository.JpaAuthSessionRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class JwtFilter extends OncePerRequestFilter {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtFilter.class);

    private final JwtUtil jwtUtil;
    private final JpaAuthSessionRepository authSessionRepository;
    private final ObjectMapper objectMapper;

    public JwtFilter(JwtUtil jwtUtil, JpaAuthSessionRepository authSessionRepository, ObjectMapper objectMapper) {
        this.jwtUtil = jwtUtil;
        this.authSessionRepository = authSessionRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws IOException, jakarta.servlet.ServletException {

        if (isPermitAllPath(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        if (!StringUtils.hasText(header) || !header.startsWith("Bearer ")) {
            writeUnauthorized(response, "AUTH_MISSING", "Missing or invalid Authorization header");
            return;
        }
        String token = header.substring(7).trim();
        try {
            jwtUtil.validateForAuth(token);
        } catch (ProcessorJwtException e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            writeUnauthorized(response, "AUTH_INVALID", e.getMessage() != null ? e.getMessage() : "Invalid token");
            return;
        }

        Claims claims;
        try {
            claims = jwtUtil.parseAllClaims(token);
        } catch (Exception e) {
            writeUnauthorized(response, "AUTH_INVALID", "Token parse error");
            return;
        }

        String jti = claims.getId();
        if (jti != null) {
            try {
                UUID jtiId = UUID.fromString(jti);
                Optional<AuthSessionEntity> session = authSessionRepository.findById(jtiId);
                if (session.isPresent() && session.get().getRevokedAt() != null) {
                    writeUnauthorized(response, "AUTH_REVOKED", "Token has been revoked");
                    return;
                }
            } catch (IllegalArgumentException e) {
                writeUnauthorized(response, "AUTH_INVALID", "Invalid jti");
                return;
            }
        }

        String sub = claims.getSubject();
        if (!StringUtils.hasText(sub)) {
            writeUnauthorized(response, "AUTH_INVALID", "Invalid subject");
            return;
        }

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        for (String p : jwtUtil.extractPermissionCodes(token)) {
            authorities.add(new SimpleGrantedAuthority(p));
        }
        for (String r : jwtUtil.extractRoleCodes(token)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + r));
        }

        var auth = new UsernamePasswordAuthenticationToken(sub, null, authorities);
        auth.setDetails(claims);
        SecurityContextHolder.getContext().setAuthentication(auth);
        try {
            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private static boolean isPermitAllPath(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method)) {
            String p = request.getServletPath();
            if (p == null) {
                p = "";
            }
            if ("/".equals(p) || "/help".equals(p)) {
                return true;
            }
        }
        if ("POST".equalsIgnoreCase(method) && request.getRequestURI().endsWith("/api/v1/auth/login")) {
            return true;
        }
        return false;
    }

    private void writeUnauthorized(HttpServletResponse response, String code, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        ApiErrorDto body = new ApiErrorDto(code, message, null, null);
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
