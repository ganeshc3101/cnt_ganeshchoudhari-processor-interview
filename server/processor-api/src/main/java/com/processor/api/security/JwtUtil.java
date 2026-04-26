package com.processor.api.security;

import com.processor.api.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.WeakKeyException;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Component
public class JwtUtil {

    private static final String CLAIM_JTI = "jti";
    private static final String CLAIM_ROLES = "roles";
    private static final String CLAIM_PERMS = "perms";

    private final JwtProperties props;
    private final SecretKey signingKey;

    public JwtUtil(JwtProperties props) {
        this.props = props;
        this.signingKey = buildKey(props.secret());
    }

    private static SecretKey buildKey(String secret) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes. Set env JWT_SECRET.");
        }
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(
            String userId,
            String jti,
            List<String> roleCodes,
            List<String> permissionCodes) {
        long ttlSeconds = Math.min(props.accessTokenTtlSeconds(), 3600);
        if (ttlSeconds < 1) {
            ttlSeconds = 3600;
        }
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .header().type("JWT").and()
                .id(jti)
                .issuer(props.issuer())
                .audience().add(props.audience()).and()
                .subject(userId)
                .issuedAt(new Date(now))
                .expiration(new Date(now + ttlSeconds * 1000))
                .claim(CLAIM_ROLES, roleCodes)
                .claim(CLAIM_PERMS, permissionCodes)
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public long accessTokenTtlSeconds() {
        long v = Math.min(props.accessTokenTtlSeconds(), 3600);
        return v < 1 ? 3600 : v;
    }

    public String extractJti(String token) {
        return parseAllClaims(token).getId();
    }

    @SuppressWarnings("unchecked")
    public List<String> extractPermissionCodes(String token) {
        List<?> p = parseAllClaims(token).get(CLAIM_PERMS, List.class);
        if (p == null) {
            return List.of();
        }
        return p.stream().map(Object::toString).toList();
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoleCodes(String token) {
        List<?> r = parseAllClaims(token).get(CLAIM_ROLES, List.class);
        if (r == null) {
            return List.of();
        }
        return r.stream().map(Object::toString).toList();
    }

    public String extractSubject(String token) {
        return parseAllClaims(token).getSubject();
    }

    public void validateForAuth(String token) {
        try {
            Claims c = parseAllClaims(token);
            if (!audienceMatches(c)) {
                throw new ProcessorJwtException("Invalid audience");
            }
        } catch (ExpiredJwtException e) {
            throw new ProcessorJwtException("Token expired", e);
        } catch (MalformedJwtException e) {
            throw new ProcessorJwtException("Malformed token", e);
        } catch (UnsupportedJwtException e) {
            throw new ProcessorJwtException("Unsupported token", e);
        } catch (WeakKeyException e) {
            throw new ProcessorJwtException("Token validation failed", e);
        } catch (io.jsonwebtoken.security.SignatureException e) {
            throw new ProcessorJwtException("Invalid signature", e);
        }
    }

    public Claims parseAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(props.issuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String newJti() {
        return UUID.randomUUID().toString();
    }

    private boolean audienceMatches(Claims c) {
        Object aud = c.get("aud");
        if (aud == null) {
            return false;
        }
        if (aud instanceof String s) {
            return props.audience().equals(s);
        }
        if (aud instanceof java.util.List<?> l) {
            return l.contains(props.audience());
        }
        return false;
    }
}
