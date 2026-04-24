# Development Rules — Code Generation & Change Control

> Applies to every code change produced in `server/`. Complements `ai-rules/*` and `backend-rules.mdc`.

---

## 1. Pre-Generation Checklist

Before writing or changing any file, answer in the reply:

1. **Which module?** `processor-core` or `processor-api`.
2. **Which layer?** Controller / ApplicationService / DomainService / RepositoryPort / RepositoryAdapter / DTO / Entity / Mapper / Config / Security.
3. **Which package?** Full dotted path.
4. **Which rule section supports this placement?** Cite file + section.
5. **Does any rule forbid it?** If yes, STOP.

If any answer is unknown, ASK. Do not guess.

---

## 2. Code Generation Constraints

- Generate only what was requested. No extra files, no speculative helpers.
- Every new class has:
  - correct package,
  - `final` class unless inheritance is intended,
  - constructor injection,
  - Javadoc on public classes explaining one-line purpose (no storytelling).
- Every DTO is a Java `record` or Lombok `@Value`. No setters.
- Every JPA entity lives in `api/persistence/entity/`, suffix `Entity`.
- Every domain model lives in `core/domain/model/`, no framework annotations.
- Every port interface lives in `core/port/repository/`, methods expressed in domain types.
- Every adapter lives in `api/persistence/adapter/`, implements exactly one port, maps at the boundary.
- Every application service lives in `api/application/`, annotated `@Service`, methods are `@Transactional` (read flows `readOnly = true`).
- Every controller lives in `api/web/controller/`, annotated `@RestController`, one `@RequestMapping` class-level path.

Forbidden in generated code:
- `@Autowired` on fields/setters.
- Static mutable state.
- `public` setters on entities.
- `new BigDecimal(double)`.
- String-concatenated SQL.
- `printStackTrace`, `System.out`, `System.err`.
- Catching `Exception` / `Throwable` without rethrow or transform.

---

## 3. Incremental Development

- Make the smallest change that satisfies the request.
- Keep commits / diffs focused: one concern per change.
- Preferred change order inside a single task:
  1. Domain (model + service + port contract + unit tests).
  2. Adapter (entity + mapper + JPA repo + port impl + slice tests).
  3. Application service (orchestration + mapping + tests).
  4. Controller (DTOs + endpoint + `@WebMvcTest`).
  5. Migration (Flyway script).
  6. Security / config updates.
- Do not open or modify an unrelated file.
- Do not reformat files beyond the lines being changed.

---

## 4. Refactoring Rules

- Never mix refactor + behavior change in one diff.
- When moving code: preserve public API unless the task explicitly allows breakage.
- When extracting a class/method:
  - keep tests green at every step,
  - preserve existing package unless a layering violation motivated the refactor,
  - update callers atomically.
- When deleting code:
  - confirm no callers via repository search,
  - remove tests and migration artifacts that become dead.
- Rename only when the new name clearly improves clarity. Renames propagate to all references including Javadoc and tests.

---

## 5. Dependency & Version Changes

- Do not add a new Maven dependency without:
  1. explicit user approval,
  2. a note on why existing deps cannot cover it,
  3. version managed in the parent `<dependencyManagement>`.
- Do not upgrade Java, Spring Boot, or Postgres major versions without an ADR.

---

## 6. Database & Migration Rules

- Schema changes are Flyway migrations: `V<n>__<snake_case_description>.sql`.
- `<n>` is strictly increasing across the codebase; never reuse or rewrite a deployed version.
- Migrations are **forward-only**. For rollbacks, add a compensating migration.
- Column types for money: `NUMERIC(19, 4) NOT NULL`.
- Every table: `id`, `created_at TIMESTAMPTZ NOT NULL`, `updated_at TIMESTAMPTZ NOT NULL`.
- Every index gets an explicit name (`idx_<table>_<cols>`).

---

## 7. Testing Requirements per Change Type

| Change                              | Required Tests                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| New DomainService method            | Unit tests covering happy, invariant-fail, edge cases                          |
| New ApplicationService method       | Unit tests with mocked DomainService + port                                    |
| New Controller endpoint             | `@WebMvcTest` covering 200/201, 400 validation, 401/403 security, 404/409     |
| New RepositoryAdapter method        | `@DataJpaTest` + Testcontainers Postgres                                       |
| New JWT / security rule             | Integration test asserting filter behavior and `ApiError` response            |
| Flyway migration                    | Verified locally against a fresh Postgres container; `mvn -pl processor-api verify` passes |

- No PR-level change merges without green tests for all touched layers.

---

## 8. API Change Protocol

- Add new endpoints under `/api/v1/...`.
- Breaking changes to existing endpoints require a new version path or a follow-up ADR.
- Update OpenAPI annotations alongside the endpoint change.
- Update frontend (`client/`) contract expectations only when asked.

---

## 9. Security Change Protocol

- Any change to `SecurityFilterChain`, JWT issuance/validation, or password handling requires:
  - explicit user approval,
  - cross-check against `security.md`,
  - updated integration test.
- Never loosen CORS, CSRF, or header policies without justification in the PR description.

---

## 10. Observability

- New endpoints log at `INFO` on success with minimal identifiers, and `WARN`/`ERROR` on failure.
- Propagate the request id (`X-Request-Id`) through MDC.
- Add metrics counters (Micrometer) for business-significant events when applicable (e.g., `transactions.accepted`, `transactions.rejected`).

---

## 11. Review Checklist (AI self-check before returning code)

- [ ] Module and package correct per `architecture.md §7`.
- [ ] No forbidden imports (Spring/JPA in core; repositories in controllers; entities in controllers/DTOs).
- [ ] Constructor injection, `final` fields.
- [ ] `@Transactional` placement correct.
- [ ] All money uses `BigDecimal` from `String`.
- [ ] Request DTOs validated with `@Valid`.
- [ ] Exceptions typed; `GlobalExceptionHandler` covers them.
- [ ] No secret, token, password, or full card number is logged.
- [ ] Tests for the affected layer(s) added/updated.
- [ ] No unrelated files modified.

---

## 12. When Blocked

If a compliant solution is not obvious, respond with:
1. A short statement of the conflict.
2. The rule(s) that create it.
3. Two or three compliant options with trade-offs.
4. A request for the user to choose.

Do not proceed until a choice is made.
