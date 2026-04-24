# Development Guidelines (Strict)

> Rules that all generated code MUST satisfy. Read with `architecture.md` and `security.md`.

---

## 1. Language & Build

- Java: **17 LTS** (use language features up to 17 only).
- Build: Maven multi-module, parent `pom.xml` declares versions in `<dependencyManagement>`.
- Encoding: UTF-8.
- File ending: LF.
- Lombok: allowed. Permitted annotations: `@RequiredArgsConstructor`, `@Getter`, `@Builder`, `@Slf4j`, `@Value`. Forbidden: `@Data`, `@Setter` on entities/domain, `@AllArgsConstructor` on entities.
- Code style: Google Java Style (4-space indent NOT allowed; use 4 spaces per Google style? — use **4 spaces**, no tabs). Max line length: 120.

---

## 2. Naming

| Element                       | Convention                                  | Example                              |
| ----------------------------- | ------------------------------------------- | ------------------------------------ |
| Package                       | lowercase, dot-separated                    | `com.statementiq.processor.core`     |
| Class                         | PascalCase                                  | `TransactionService`                 |
| Interface (port)              | PascalCase, noun, suffix `Repository` / `Port` | `TransactionRepository`           |
| Implementation                | InterfaceName + `Adapter` or context suffix | `JpaTransactionRepositoryAdapter`    |
| DTO (request)                 | suffix `Request`                            | `CreateTransactionRequest`           |
| DTO (response)                | suffix `Response`                           | `TransactionResponse`                |
| JPA entity                    | suffix `Entity`                             | `TransactionEntity`                  |
| Domain model                  | no suffix                                   | `Transaction`                        |
| Mapper                        | suffix `Mapper`                             | `TransactionMapper`                  |
| Domain service                | suffix `Service`                            | `TransactionDomainService`           |
| Application service           | suffix `UseCase` or `ApplicationService`    | `CreateTransactionUseCase`           |
| Exception                     | suffix `Exception`                          | `TransactionRejectedException`       |
| Constant                      | UPPER_SNAKE_CASE                            | `MAX_FILE_SIZE_BYTES`                |
| Method                        | camelCase, verb phrase                      | `acceptTransaction`                  |
| Boolean variable              | `is`/`has`/`can` prefix                     | `isAccepted`                         |
| Test class                    | suffix `Test` (unit) / `IT` (integration)   | `TransactionServiceTest`             |

- Do not abbreviate domain words (`txn` → `transaction`).

---

## 3. Class Design Rules

- Every class is `final` unless designed for inheritance (then document why).
- Fields are `private final` unless mutability is essential.
- Constructor injection only. **No** `@Autowired` on fields/setters.
- One public class per file. Filename matches class name.
- One responsibility per class. If a class needs "and" in its description, split it.
- No utility-class instantiation: utility classes are `final` with a `private` constructor.
- Domain models: prefer immutability. Mutating methods return a new instance OR are explicitly named (`apply...`, `with...`).
- No public mutable static state. `static` fields must be `final` and immutable.

---

## 4. Method Rules

- Maximum **40 lines** per method (excluding braces and blank lines). Split otherwise.
- Maximum **4 parameters**. Use a parameter object beyond that.
- Cyclomatic complexity ≤ **10** per method.
- Nesting depth ≤ **3** levels. Use guard clauses / extracted methods.
- No `null` returns from public methods. Use `Optional<T>`, empty collection, or throw.
- No `null` parameters in public methods unless annotated `@Nullable`.
- Method name MUST start with a verb.

---

## 5. Package Structure

- Match the layout in `architecture.md` §7. Do not introduce new top-level packages without an ADR.
- One feature per leaf package when feasible.
- A class belongs to **one and only one** layer package.

---

## 6. Logging

- Use `org.slf4j.Logger` (via `@Slf4j` or `LoggerFactory`).
- Log levels:
  - `ERROR`: handled-but-failed operations, unexpected exceptions
  - `WARN`: recoverable anomalies, validation failures of significance
  - `INFO`: business-relevant events (transaction accepted, user created)
  - `DEBUG`: developer diagnostics, request/response shapes
  - `TRACE`: rarely; only when explicitly needed
- Use **parameterized** logs only: `log.info("Accepted txn id={}", id);`. No string concatenation.
- NEVER log:
  - Raw passwords
  - Full card numbers (mask all but last 4)
  - JWT tokens
  - Personally identifiable info beyond what is required
- Include a correlation/request id in every log line within a request scope (MDC).

---

## 7. Error Handling

- Throw **typed** exceptions from `core/domain/exception/` (e.g. `ValidationException`, `NotFoundException`, `ConflictException`).
- Domain exceptions extend a single base `DomainException` in core.
- Application/web exceptions extend a single base `ApiException` in api.
- All exceptions surface through a single `@RestControllerAdvice GlobalExceptionHandler` returning a uniform `ApiError` body:
  ```
  {
    "code": "string",        // stable machine code, e.g. TRANSACTION_REJECTED
    "message": "string",     // human-readable
    "details": [...optional],
    "traceId": "string"
  }
  ```
- Map exceptions → HTTP status:
  - `ValidationException`, `MethodArgumentNotValidException` → 400
  - `AuthenticationException` → 401
  - `AccessDeniedException` → 403
  - `NotFoundException` → 404
  - `ConflictException` → 409
  - All unhandled → 500 (log at `ERROR`, never expose stack traces)
- Never `catch (Exception e)` and swallow. Either re-throw or transform with cause attached.
- Never `throw new RuntimeException(...)` from production code. Use a typed exception.

---

## 8. Money & BigDecimal

- All monetary values: `BigDecimal`.
- NEVER use `double`/`float` for money.
- Construct from `String`: `new BigDecimal("12.34")`. NEVER from `double`.
- Always specify scale and rounding for division: `value.divide(other, 2, RoundingMode.HALF_EVEN)`.
- Default scale for USD: **2**.
- Default rounding: `HALF_EVEN` (banker's rounding) unless specified.
- Compare with `compareTo`, never `equals` (`equals` differentiates `2.0` from `2.00`).
- Persist as `NUMERIC(19, 4)` in PostgreSQL (or higher precision if domain requires).

---

## 9. REST API Conventions

- Base path: `/api/v1` (versioned).
- Resource URLs: plural nouns, kebab-case, no verbs (`/api/v1/transactions`, `/api/v1/users/{id}`).
- Use HTTP verbs correctly: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- Idempotency: `GET`, `PUT`, `DELETE` are idempotent; `POST` is not.
- Status codes:
  - 200 OK — successful read or update with body
  - 201 Created — successful resource creation; include `Location` header
  - 202 Accepted — async work queued
  - 204 No Content — successful op with no body
  - 400 Bad Request — validation/format
  - 401 Unauthorized — missing/invalid token
  - 403 Forbidden — authenticated but not allowed
  - 404 Not Found
  - 409 Conflict
  - 422 Unprocessable Entity — semantically invalid (use sparingly; prefer 400)
  - 500 Internal Server Error
- Content type: `application/json` only (unless explicitly file upload).
- DTOs are immutable Java records or Lombok `@Value`.
- Never expose JPA entities through controllers.
- Never accept JPA entities as request bodies.
- Date/time: ISO-8601 strings, UTC (`Instant` in Java).
- Money in API: object form `{ "amount": "12.34", "currency": "USD" }` with string amount; never floating-point.

---

## 10. Validation

- Use Jakarta Bean Validation (`jakarta.validation.constraints.*`) on request DTOs.
- Validate at the controller via `@Valid`.
- Domain invariants are validated again in DomainService — defense in depth.
- Common constraints:
  - `@NotNull`, `@NotBlank`, `@Size`, `@Pattern`, `@Email`, `@Min`, `@Max`, `@DecimalMin`, `@DecimalMax`
- For card numbers: validate via Luhn check in DomainService, not annotation.
- Never trust client-supplied IDs that affect ownership; always re-resolve from the authenticated principal.

---

## 11. Pagination, Filtering, Sorting

- All list endpoints MUST be paginated.
- Use Spring `Pageable` at the application layer; expose `page` (0-indexed), `size` (default 20, max 100), `sort` (`field,asc|desc`).
- Response shape:
  ```
  {
    "items": [...],
    "page": 0,
    "size": 20,
    "totalItems": 123,
    "totalPages": 7
  }
  ```
- Filters are explicit query parameters with typed validation. No "magic" generic filter strings.
- Sorting is restricted to a whitelist of fields per endpoint.

---

## 12. Persistence

- One JPA entity per table. No inheritance unless required (`@MappedSuperclass` for shared audit fields).
- Use `Long` (or `UUID`) primary keys. Generation: `IDENTITY` for Postgres `BIGSERIAL`.
- All entities have audit columns: `createdAt`, `updatedAt`, optionally `createdBy`, `updatedBy`.
- Use Flyway for migrations: files in `src/main/resources/db/migration/V<version>__<description>.sql`.
- Never modify a Flyway migration after it has been deployed; create a new one.
- No `cascade = ALL` on `@ManyToOne`. Be explicit and conservative.
- Avoid lazy-loading bugs: do not return managed entities outside transactions.

---

## 13. Concurrency

- Service classes are stateless and thread-safe.
- Use `@Transactional` on application services for multi-step write flows.
- For optimistic locking on contended rows, add `@Version`.
- Avoid `synchronized` blocks unless absolutely required and documented.

---

## 14. Testing

- Unit tests: JUnit 5 + AssertJ + Mockito. Live in same module as code under test.
- Domain (`processor-core`): unit tests only. No Spring context, no DB.
- Application (`processor-api`):
  - Unit tests for ApplicationServices and Mappers.
  - Slice tests with `@WebMvcTest` for controllers.
  - `@DataJpaTest` (with Testcontainers Postgres) for adapters.
  - `@SpringBootTest` integration tests sparingly; mark with suffix `IT`.
- Coverage targets: domain ≥ 90%, api ≥ 75% (lines).
- Forbidden in tests: `Thread.sleep`, time-of-day assertions, ordering by hash.

---

## 15. Configuration

- All config in `application.yml` (not `.properties`).
- Profiles: `local`, `test`, `prod`.
- All secrets via environment variables (`SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, etc.). No secrets in YAML.
- Use `@ConfigurationProperties` typed beans, never scattered `@Value` injections.

---

## 16. Forbidden Patterns

- `@Autowired` on fields or setters.
- Field-level mutation in services.
- Public setters on JPA entities (use builder/factory).
- Returning `Optional<T>` as a method parameter.
- Using `Optional.get()` without `isPresent()` (prefer `orElse*` / `map`).
- `System.out.println` / `printStackTrace`.
- Catching `Throwable` or `Error`.
- Time access via `new Date()` / `System.currentTimeMillis()` directly in business code — inject a `java.time.Clock`.
- Static singletons holding state.
- Direct SQL strings in services (`@Query` allowed only in Spring Data interfaces inside the adapter).
