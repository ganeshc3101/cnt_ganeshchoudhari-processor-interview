# Server — Card transaction processor API

Spring Boot application that exposes a secured REST API for **authentication**, **transaction ingestion** (manual JSON arrays and **batch file upload** — CSV or JSON), **reporting**, and **audit/activity** logging. Business rules (card validation, parsing, processing) live in a separate Maven module so the domain stays isolated from HTTP and persistence.

PostgreSQL is the system of record; schema and seeds are applied via idempotent scripts in `scripts/` (see [scripts/README.md](./scripts/README.md) for full detail).

---

## Technology stack

| Area | Choice |
| --- | --- |
| Language | **Java 17** |
| Framework | **Spring Boot 3.2.x** |
| Web / REST | Spring Web MVC |
| Persistence | **Spring Data JPA**, Hibernate, **PostgreSQL** |
| Security | Spring Security, **JWT** (jjwt), BCrypt passwords, method-level authorization |
| Build | **Maven** (multi-module reactor) |

---

## Maven modules

```
server/
├── pom.xml                 # Parent POM: dependency management, module list
├── processor-core/         # Domain: models, validation, parsing, processing, reporting ports
└── processor-api/          # Spring Boot app: controllers, DTOs, JPA entities, security, config
```

- **processor-core** — Pure(ish) domain logic: e.g. `TransactionProcessorService`, `TransactionFileParser`, `CardValidator`, repository **interfaces** (ports). No Spring Web dependency here; keep new business rules here when possible.
- **processor-api** — Executable JAR: implements repositories, REST controllers under `/api/v1/*`, global exception handling, JWT filter, CORS, multipart limits (see `application.yml`).

Build the whole reactor from `server/`:

```bash
mvn -q verify
```

Run only the API module (uses sibling `processor-core` as a dependency):

```bash
cd server
mvn -pl processor-api spring-boot:run
```

Main class: `com.processor.api.ProcessorApiApplication`.

---

## Prerequisites

- **JDK 17** (aligns with `maven.compiler.release` in the parent POM).
- **PostgreSQL** — local default URL `jdbc:postgresql://localhost:5432/processor` with user/password matching config (see below).
- **Maven 3.8+** (or use your IDE’s Maven integration).

Fastest path to a fresh DB: run the idempotent bootstrap from the `server/` directory — **macOS/Linux:**

```bash
./scripts/db_setup.sh
```

**Windows:** see [scripts/README.md](./scripts/README.md) for `db_setup.ps1` and `PGPASSWORD` requirements.

That script creates the DB role/database if needed and applies all SQL under `scripts/sql/` in order. It optionally installs PostgreSQL 16 via Homebrew on macOS. Then start the API as shown above.

---

## Configuration

Primary config file: `processor-api/src/main/resources/application.yml`.

| Concern | Notes |
| --- | --- |
| **Datasource** | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` (defaults: `jdbc:postgresql://localhost:5432/processor`, user `processor`, password `processor`). |
| **HTTP port** | `SERVER_PORT` — default **9091** (comment in YAML explains avoiding clashes with 8080). |
| **JPA** | `ddl-auto: validate` — schema must match entities; use SQL scripts for schema, not Hibernate auto-ddl. |
| **JWT** | `JWT_SECRET` (or default dev secret in YAML — **change in production**), issuer/audience, access token TTL. |
| **Upload limits** | Multipart max file/request size (10MB / 50MB defaults in YAML). |
| **Jackson** | `fail-on-unknown-properties: true`; `non_null` serialization. |

API routes are **not** behind a servlet context path by default; controllers use class mappings like `@RequestMapping("/api/v1/transactions")`, so the full path is `http://localhost:9091/api/v1/transactions`.

---

## API surface (high level)

All under prefix **`/api/v1`** unless noted:

| Area | Purpose |
| --- | --- |
| **Auth** | Login (public), logout, current user (`/auth/...`) |
| **Transactions** | CRUD-style listing with filters, manual create (JSON array of transactions), batch upload (multipart CSV/JSON) |
| **Reports** | Aggregations for dashboard: volume by card brand, by day, rejected summaries, etc. |
| **Activity logs** | Audit / user activity endpoints where implemented |

Exact request/response types are the Java DTOs in `processor-api/.../dto/` and should match the client Zod schemas.

**Security:** JWT bearer authentication for protected routes; login endpoint permitted without token. Roles and permissions are seeded in SQL (`SUPER_ADMIN`, `ADMIN`, `ANALYST`, `OPERATOR`, `VIEWER`) — see [scripts/README.md](./scripts/README.md) for the permission matrix and seeded usernames.

---

## Postman

The `postman/` directory contains:

- `Processor-API.postman_collection.json` — requests against the API
- `Processor-API.local.postman_environment.json` / `Processor-API.production.postman_environment.json` — environment variables (base URL, tokens)
- `build_postman_collection.py` — optional generator for the collection
- `sample-batch.csv` — sample upload payload

Import the collection and local environment, set variables (including any `seedPassword` / token workflow per comments in the SQL readme), and run against a live `processor-api` instance.

---

## Project layout (server repo root)

```
server/
├── pom.xml
├── processor-core/           # Domain module
│   └── src/main/java/com/processor/core/
│       ├── model/
│       ├── parser/
│       ├── service/
│       ├── validator/
│       └── repository/     # Port interfaces
├── processor-api/          # Spring Boot module
│   └── src/main/java/com/processor/api/
│       ├── controller/
│       ├── dto/
│       ├── entity/
│       ├── repository/     # JPA + adapters
│       ├── security/
│       ├── service/        # Application services orchestrating core + persistence
│       ├── config/
│       └── batch/          # Batch readers (e.g. JSON lines) if present
├── scripts/                # DB bootstrap — see scripts/README.md
│   ├── db_setup.sh
│   ├── db_setup.ps1
│   └── sql/
├── postman/                  # Postman assets
└── ai-rules/                 # Optional architecture notes for contributors
```

---

## Testing and quality

- Unit/integration tests can live under `processor-api/src/test` (and optionally core). Run:

  ```bash
  mvn -q test
  ```

- Prefer adding tests in **processor-core** for pure business rules and in **processor-api** for web-layer and persistence integration.

---

## Troubleshooting

| Issue | What to check |
| --- | --- |
| `validate` DDL errors on startup | DB schema out of sync; re-run `scripts/sql` pipeline or compare entities vs. tables. |
| Auth failures | Seeded users/passwords in `09_seed_admin_user.sql`; JWT secret and clock; login accepts username or email case-insensitively per README in scripts. |
| Batch upload failures | File size limits, CSV/JSON format, and core validation (card prefixes, timestamps). |
| Connection refused on 9091 | Process not started or wrong `SERVER_PORT`. |

---

## Related documentation

- [scripts/README.md](./scripts/README.md) — detailed DB setup, env vars, role matrix, schema design notes, Flyway migration notes.
- [Client README](../client/README.md) — running the SPA and `VITE_API_BASE_URL` alignment.
