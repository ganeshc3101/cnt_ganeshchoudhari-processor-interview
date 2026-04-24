# Architecture (Authoritative)

> Single source of truth for module boundaries, layers, and dependency direction. All other docs reference this.

---

## 1. Modules

| Module          | Type             | Contains                                                                  | May Use                              |
| --------------- | ---------------- | ------------------------------------------------------------------------- | ------------------------------------ |
| `processor-core` | Pure Java        | Domain models, domain services, repository interfaces (ports), exceptions | JDK only, SLF4J api                  |
| `processor-api`  | Spring Boot      | Controllers, DTOs, application services, JPA entities, repository impls (adapters), config, security | `processor-core`, Spring, JPA, etc. |

- `processor-core` is the **inner** layer.
- `processor-api` is the **outer** layer (frameworks, infrastructure, delivery).
- No third module is permitted without an ADR.

---

## 2. Layered Architecture

```
HTTP request
    │
    ▼
[ Controller ]            ──► api layer
    │
    ▼
[ Application Service ]   ──► api layer (orchestration, mapping)
    │
    ▼
[ Domain Service ]        ──► core layer (business rules)
    │
    ▼
[ Repository Port ]       ──► core layer (interface)
    │
    ▼
[ Repository Adapter ]    ──► api layer (JPA impl)
    │
    ▼
[ Database ]              ──► infrastructure
```

- Direction of dependency: **outer → inner only**.
- Inner layers MUST NOT know outer layers exist.

---

## 3. Layer Responsibilities (Strict)

| Layer                 | MUST                                                                | MUST NOT                                                                  |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Controller            | Parse request, validate input shape, delegate to ApplicationService, build HttpResponse | Hold business rules, talk to repository, talk to DomainService directly, throw raw runtime exceptions |
| ApplicationService    | Map DTO ↔ Domain, orchestrate one or more DomainServices, manage transactions, handle authorization checks | Contain business rules, query DB directly, depend on Spring annotations in core types |
| DomainService (core)  | Encapsulate business rules, invariants, validation, decisions       | Import any Spring/JPA/HTTP class, depend on DTOs, depend on JPA entities  |
| RepositoryPort (core) | Define data access contracts in domain language                     | Reference JPA, SQL, Spring, or DB types                                   |
| RepositoryAdapter (api) | Implement port, translate Domain ↔ Entity, run queries           | Expose JPA types outside this layer, leak transactions across boundaries  |
| JPA Entity            | Mirror DB schema                                                    | Travel outside the adapter; be returned from ApplicationService or Controller |

---

## 4. Dependency Rules (Hard)

Allowed:
- `processor-api` → `processor-core`
- Controller → ApplicationService
- ApplicationService → DomainService
- ApplicationService → RepositoryPort
- DomainService → RepositoryPort
- DomainService → Domain models
- RepositoryAdapter (api) → RepositoryPort (core), JPA Entity, JPA repo
- RepositoryAdapter → Domain mapper

Forbidden:
- `processor-core` → `processor-api` (any class)
- `processor-core` → `org.springframework.*`
- `processor-core` → `jakarta.persistence.*`
- `processor-core` → `org.hibernate.*`
- `processor-core` → `javax.sql.*` / `java.sql.*`
- Controller → Repository* (port or adapter)
- Controller → JPA Entity
- DomainService → DTO
- DomainService → JPA Entity
- ApplicationService → Controller
- Any layer → concrete RepositoryAdapter (always inject the port)

---

## 5. Data Flow

```
Request DTO ──┐
              │ (Application Service maps)
              ▼
         Domain Object ──► Domain Service ──► Repository Port
                                                    │
                                                    │ (Adapter maps)
                                                    ▼
                                              JPA Entity ──► DB
                                                    ▲
                                                    │
                                              JPA Entity
                                                    │
                                              Domain Object ──► Application Service ──► Response DTO
```

- Mapping happens at exactly **two boundaries**: DTO↔Domain (ApplicationService) and Domain↔Entity (RepositoryAdapter).
- Domain object is the **only type** that crosses the core boundary.

---

## 6. Domain vs Entity (Mandatory Separation)

| Concern               | Domain Model (core)             | JPA Entity (api)                    |
| --------------------- | ------------------------------- | ----------------------------------- |
| Location              | `processor-core`                | `processor-api`                     |
| Annotations allowed   | None (or Lombok if approved)    | `@Entity`, `@Table`, `@Column`, etc |
| Identity              | Value-typed id                  | Primary key                         |
| Behavior              | Business methods, invariants    | Persistence representation only     |
| Lifecycle             | Pure object                     | Managed by JPA                      |
| Cycles                | Not allowed                     | Avoid bidirectional unless required |

- A 1:1 mapper (`SomethingMapper`) lives in the adapter and converts between them.
- Never reuse a JPA entity as a domain model.
- Never reuse a domain model as a JPA entity.

---

## 7. Project Structure (Required)

```
server/
├── pom.xml                              (parent, packaging=pom)
├── processor-core/
│   ├── pom.xml
│   └── src/main/java/com/statementiq/processor/core/
│       ├── domain/
│       │   ├── model/                   (Domain objects, value objects)
│       │   └── exception/               (Domain exceptions)
│       ├── port/
│       │   └── repository/              (Repository interfaces)
│       └── service/                     (Domain services)
└── processor-api/
    ├── pom.xml
    └── src/main/java/com/statementiq/processor/api/
        ├── ProcessorApplication.java    (Spring Boot main)
        ├── config/                      (Beans, security, web, jpa config)
        ├── web/
        │   ├── controller/              (REST controllers)
        │   ├── dto/                     (Request/Response DTOs)
        │   ├── mapper/                  (DTO ↔ Domain mappers)
        │   └── error/                   (GlobalExceptionHandler, ApiError)
        ├── application/                 (Application services / use cases)
        ├── persistence/
        │   ├── entity/                  (JPA entities)
        │   ├── repository/              (Spring Data JPA interfaces)
        │   ├── adapter/                 (RepositoryPort impls)
        │   └── mapper/                  (Entity ↔ Domain mappers)
        └── security/                    (JWT filter, providers, services)
```

- Package names are normative.
- New top-level packages require an ADR.

---

## 8. Stateless Services

- Every service class MUST be stateless and thread-safe.
- No mutable instance fields except injected collaborators (themselves stateless).
- No static mutable state.
- No `HttpSession`, no in-memory caches without explicit design.

---

## 9. Repository Abstraction

- Domain depends on `RepositoryPort` interfaces only.
- Each port lives in `core/port/repository/` and uses domain types in its method signatures.
- Implementations live in `api/persistence/adapter/` and are annotated `@Repository` (or `@Component`).
- Spring Data JPA interfaces are an **internal detail** of the adapter and MUST NOT be injected outside the adapter package.

---

## 10. Transactions

- `@Transactional` is allowed **only on ApplicationService** methods.
- `@Transactional(readOnly = true)` for read-only flows.
- Never on DomainService, never on Controller, never on RepositoryAdapter methods.

---

## 11. Forbidden Cross-Cutting

- No business logic in Controllers.
- No DTOs in core.
- No JPA Entities in core or in Controllers.
- No `EntityManager` outside RepositoryAdapter.
- No `SecurityContextHolder` outside `security/` and ApplicationService.
- No direct `RestTemplate`/`WebClient` calls in DomainService.
