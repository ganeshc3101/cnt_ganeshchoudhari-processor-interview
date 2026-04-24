# Security Rules (Strict)

> Authentication is JWT-based, stateless. All endpoints are deny-by-default.

---

## 1. Authentication Model

- **Stateless** JWT bearer authentication.
- No HTTP sessions. `SessionCreationPolicy.STATELESS`.
- No CSRF cookies (CSRF is disabled because there are no session cookies). If cookie-based auth is later added, CSRF MUST be re-enabled.
- One token type only: short-lived **access token**. Refresh-token strategy requires an ADR before introduction.

---

## 2. JWT Specification

- Algorithm: **HS256** (default) or **RS256** if a key pair is provisioned.
- Claims (required):
  - `sub` — user id (string)
  - `iss` — `processor-api`
  - `aud` — `processor-client`
  - `iat` — issued-at (epoch seconds)
  - `exp` — expiry (epoch seconds, ≤ 60 minutes from `iat`)
  - `jti` — unique token id (UUID)
- Claims (optional):
  - `roles` — array of string role names (e.g. `["ADMIN", "USER"]`)
- Forbidden claims: passwords, full names, emails, PII.
- Token MUST be signed; unsigned (`alg: none`) tokens MUST be rejected.

---

## 3. JWT Lifecycle

```
Login (POST /api/v1/auth/login)
  → validate credentials (BCrypt)
  → issue JWT (≤ 60 min)
  → return { "tokenType": "Bearer", "accessToken": "...", "expiresIn": 3600 }

Subsequent requests
  → header: Authorization: Bearer <token>
  → JwtAuthenticationFilter validates signature, exp, iss, aud
  → populates SecurityContext with authenticated principal
  → controller proceeds
```

- On expiry: client re-authenticates via `/auth/login`. No silent refresh until a refresh-token ADR exists.
- Logout is client-side (drop the token). Server may maintain a `jti` denylist if revocation is required.

---

## 4. Token Validation Rules

The `JwtAuthenticationFilter` MUST:
1. Extract `Authorization` header. Reject if missing on protected endpoints.
2. Verify scheme is `Bearer`.
3. Verify signature with the configured secret/key.
4. Verify `iss`, `aud` match expected values.
5. Verify `exp` is in the future.
6. Verify `nbf` (if present) is in the past.
7. Verify `jti` is not in the denylist (if denylist is enabled).
8. Build an `Authentication` object with principal = user id, authorities = mapped roles.
9. On any failure: return `401 Unauthorized` with `ApiError` body, never a stack trace.

---

## 5. Password Storage

- Algorithm: **BCrypt** with cost factor **12** (re-evaluate annually).
- NEVER store plaintext passwords.
- NEVER log passwords or hashes.
- Compare via `BCryptPasswordEncoder.matches`. NEVER manual string compare.
- Password change flow re-hashes; old hash is discarded.
- Minimum complexity (enforced in DTO + DomainService):
  - Length ≥ 12
  - Contains upper, lower, digit, symbol
  - Not in a common-password denylist (if available)

---

## 6. Endpoint Protection (Deny-By-Default)

`SecurityFilterChain` rules:
- All endpoints **require authentication** by default.
- Explicit `permitAll()` for:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/register` (only if registration is publicly allowed)
  - `GET /actuator/health/liveness`
  - `GET /actuator/health/readiness`
  - OpenAPI / Swagger UI in non-prod profiles only
- Role-based authorization via `@PreAuthorize("hasRole('ADMIN')")` on application-service or controller methods.
- Method-level security MUST be enabled: `@EnableMethodSecurity`.
- Ownership checks (a user can access only their own data) live in ApplicationService, NEVER trusted from the client.

---

## 7. Input Validation & Output Encoding

- Validate every request DTO with Jakarta Bean Validation (`@Valid`).
- Reject unknown JSON fields: `spring.jackson.deserialization.fail-on-unknown-properties=true`.
- Sanitize / validate IDs in path variables (`@Pattern`, type binding).
- For free-form text persisted and re-rendered, never trust client input — encode at the consumer (frontend) and validate length/charset on the server.
- File uploads:
  - Whitelist MIME types: `text/csv`, `application/json`, `application/xml`, `text/xml`.
  - Enforce max size (`spring.servlet.multipart.max-file-size`).
  - Stream parse; do not buffer entire file in memory beyond the configured limit.
  - Reject filenames containing `..`, `/`, `\`, control chars.

---

## 8. Transport & Headers

- Production MUST be HTTPS only. Reject plaintext (terminate at LB; redirect HTTP→HTTPS).
- Required response headers (configure via Spring Security):
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: no-referrer`
  - `Cache-Control: no-store` on auth and account endpoints
- Remove `Server` and `X-Powered-By` headers.

---

## 9. CORS

- Allowed origins: explicit allowlist, no wildcards in prod.
- Allowed methods: only those used.
- Allowed headers: only those required (`Authorization`, `Content-Type`, `X-Request-Id`).
- `allowCredentials = false` (because we use bearer tokens, not cookies).

---

## 10. Secrets Management

- Secrets (DB password, JWT secret, etc.) come **only** from environment variables or a secret manager.
- NEVER commit secrets to git, YAML, properties, or test resources.
- Local dev secrets live in `.env` (git-ignored). Provide `.env.example` with placeholders.

---

## 11. Logging & Audit

- Audit-log security-relevant events at `INFO` (or higher):
  - Successful login (user id, request id, IP)
  - Failed login attempt (user id if known, request id, IP, reason category)
  - Token rejected (reason category, request id)
  - Authorization denial (principal id, resource, action)
- Never log credentials, tokens, full card numbers, full SSNs, etc.
- Mask card numbers to last 4: `**** **** **** 1234`.

---

## 12. Rate Limiting & Brute-Force Protection

- Authentication endpoints (`/auth/login`, `/auth/register`) MUST be rate-limited (per IP + per user).
- Lock accounts after N consecutive failed logins (configurable). Document the policy in `decisions.md` if changed.

---

## 13. Anti-Patterns (Forbidden)

- Storing JWT in a cookie without `HttpOnly`, `Secure`, `SameSite=Strict`.
- Returning the JWT in a URL or query parameter.
- Accepting a user id from the request body to determine ownership.
- Disabling Spring Security with `permitAll()` blanket rules.
- Using `BCrypt.checkpw` outside of the password encoder bean.
- Custom crypto. Use library primitives only.
- Reflective / dynamic SQL built from request input.
- Returning raw exception messages to clients (information disclosure).
