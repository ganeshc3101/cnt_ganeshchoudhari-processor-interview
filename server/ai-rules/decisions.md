# Architectural Decision Records

> Each decision is terminal. To change one, add a new ADR that supersedes it. Never rewrite history.

---

## ADR-001: Multi-Module Maven Project

**Status:** Accepted
**Decision:**
- Two modules: `processor-core` (pure Java) and `processor-api` (Spring Boot).
- `processor-core` has zero Spring / JPA / DB dependencies.

**Rationale:**
- Enforces Clean Architecture at the build level; the module boundary makes forbidden dependencies a compile error, not a convention.
- Keeps business rules portable (CLI, batch, alternative transports can reuse core).
- Unit tests in core run fast without a Spring context.

**Consequences:**
- Slightly more build overhead (two `pom.xml`).
- Mappers at the boundary must be written explicitly.
- No Spring stereotypes (`@Service`, `@Component`) in core; wiring happens in `processor-api` config.

**Alternatives rejected:**
- Single-module with package-level discipline — insufficient enforcement; drifts over time.
- Three-module (core / application / infrastructure) — unnecessary complexity for current scope.

---

## ADR-002: PostgreSQL as Primary Database

**Status:** Accepted
**Decision:**
- PostgreSQL 14+ is the system of record.
- Accessed via Spring Data JPA / Hibernate.

**Rationale:**
- Strong ACID guarantees required for financial/transaction data.
- Rich decimal precision (`NUMERIC`) for monetary fields.
- Mature JSONB support for semi-structured payloads if needed.
- Broad operational tooling, backups, and hosting availability.

**Consequences:**
- Schema migrations via Flyway are mandatory.
- Domain remains database-agnostic through repository ports; PostgreSQL is an implementation detail.
- Use `NUMERIC(19, 4)` for money columns.

**Alternatives rejected:**
- MySQL — weaker `DECIMAL` semantics historically and fewer advanced types.
- NoSQL (MongoDB, DynamoDB) — poor fit for transactional, relational data with strict consistency.
- H2 — test-only; never production.

---

## ADR-003: Stateless JWT Authentication

**Status:** Accepted
**Decision:**
- JWT bearer tokens; no server-side session state.
- Short-lived access tokens (≤ 60 minutes). No refresh tokens until a follow-up ADR.

**Rationale:**
- Stateless servers scale horizontally without sticky sessions.
- Clean integration with SPA clients and future mobile/API consumers.
- No server memory of logins → no session-store infrastructure.

**Consequences:**
- Logout is client-side; revocation requires an optional `jti` denylist.
- Tokens MUST stay out of URLs; only `Authorization: Bearer`.
- Clock skew tolerated within a small window (≤ 30s) during validation.
- All security claims (roles) must fit in the token; the token becomes a trust boundary.

**Alternatives rejected:**
- Server-side sessions — breaks horizontal scale without shared store.
- OAuth2 / OIDC full stack — overkill until a third party issues identities.

---

## ADR-004: Repository Pattern (Ports & Adapters)

**Status:** Accepted
**Decision:**
- Domain services depend on `RepositoryPort` interfaces defined in `processor-core`.
- `processor-api` provides `RepositoryAdapter` implementations backed by Spring Data JPA.
- Domain and JPA entity types are distinct; a mapper converts between them.

**Rationale:**
- Inverts dependency so the domain owns its contract, not the framework.
- Keeps business logic testable with in-memory fakes — no Spring / DB required.
- Allows replacing persistence (e.g., switch to JDBC, a different DB, or an event store) without changing domain code.

**Consequences:**
- Boilerplate mappers (Domain ↔ Entity).
- Developers must resist the shortcut of injecting Spring Data repositories into services.
- Linting / architecture tests (e.g., ArchUnit) SHOULD enforce the boundary.

**Alternatives rejected:**
- Inject Spring Data repositories directly into services — leaks framework and DB concerns into business code.
- Anemic entities (JPA entities as the domain model) — couples business rules to the ORM lifecycle.

---

## ADR-005: Clean Architecture Layering

**Status:** Accepted
**Decision:**
- Layers, in order of dependency (outer → inner): Controller → ApplicationService → DomainService → RepositoryPort.
- Outer layers may depend on inner. Inner layers MUST NOT depend on outer.
- Business logic lives only in DomainService.

**Rationale:**
- Testability: business rules are isolated from frameworks and I/O.
- Replaceability: transport (REST), persistence (JPA), and security (JWT) can change without touching business logic.
- Predictability: every class has exactly one layer, one responsibility.

**Consequences:**
- More files than a layered "controller + service + repository" approach.
- Mappers at DTO↔Domain and Domain↔Entity boundaries.
- Controllers cannot inject repositories.

---

## ADR-006: Constructor Injection Only

**Status:** Accepted
**Decision:**
- All Spring beans use constructor injection.
- No `@Autowired` on fields or setters.

**Rationale:**
- Enables `final` fields, compile-time safety, and easy testing without reflection.
- Makes missing dependencies visible at startup.

**Consequences:**
- Lombok `@RequiredArgsConstructor` is the preferred form.

---

## ADR-007: BigDecimal for All Money

**Status:** Accepted
**Decision:**
- Monetary values use `java.math.BigDecimal`, constructed from `String`.
- Default scale 2 for USD, rounding `HALF_EVEN`.

**Rationale:**
- Binary floating-point (`double`, `float`) cannot represent decimal fractions exactly; unacceptable for financial data.

**Consequences:**
- Never perform arithmetic with `double` on money.
- APIs transport amounts as strings in JSON to avoid float loss.

---

## ADR-008: Flyway for Schema Migrations

**Status:** Accepted
**Decision:**
- Flyway manages all schema changes.
- Migration files are immutable once merged to the main branch.

**Rationale:**
- Versioned, auditable, repeatable.
- Production DB and test DB stay in sync.

**Consequences:**
- Fix-forward only. No editing deployed migrations; write a new one.
- Baseline an existing DB before first Flyway deployment.

---

## ADR-009: SLF4J + Structured Logs

**Status:** Accepted
**Decision:**
- Logging via SLF4J API; backend is Logback (Spring Boot default).
- Parameterized logs only; MDC-driven request/trace ids.

**Rationale:**
- Performance (lazy formatting).
- Observability (structured, correlatable lines).
