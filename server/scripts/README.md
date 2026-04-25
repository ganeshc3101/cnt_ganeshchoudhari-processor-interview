# server/scripts

Dev-only bootstrap scripts that bring a fresh machine from "Postgres installed" to "backend boots" in one command.

Every script is **idempotent** — safe to re-run. No data in existing tables is destroyed unless it's the legacy skeleton shape (detected by the presence of a `card_number` column, which the new design does not use).

---

## Contents

```
scripts/
├── db_setup.sh        # macOS / Linux
├── db_setup.ps1       # Windows (PowerShell 5.1+)
├── README.md
└── sql/
    ├── 00_reset_legacy.sql        # drops legacy skeleton tables (only if they exist)
    ├── 01_extensions.sql          # pgcrypto
    ├── 02_schema_users.sql        # users, roles, permissions, *_permissions, user_roles, auth_sessions
    ├── 03_schema_transactions.sql # transaction_batches, transactions, rejected_transactions
    ├── 04_schema_activity.sql     # activity_logs
    ├── 05_schema_master.sql       # card_brands, currencies
    ├── 06_seed_master.sql         # brands + currencies
    ├── 07_seed_permissions.sql    # permission catalog
    ├── 08_seed_roles.sql          # SUPER_ADMIN / ADMIN / ANALYST / OPERATOR / VIEWER + mappings
    └── 09_seed_admin_user.sql     # default admin user (password via ADMIN_PASSWORD env var)
```

SQL files are executed in filename order. Each is individually idempotent, so the whole pipeline can be re-run after any change without special flags.

---

## macOS / Linux

```bash
# First-time run (uses all defaults)
cd server
./scripts/db_setup.sh

# Then boot the app
mvn -pl processor-api spring-boot:run
```

Override defaults as needed:

```bash
ADMIN_PASSWORD='StrongDevPw#1!' \
DB_PASSWORD='processor' \
DB_PORT=5432 \
./scripts/db_setup.sh
```

The script will:
1. Install `postgresql@16` via Homebrew if missing (macOS only).
2. Start the Postgres service (`brew services start` or `systemctl start`).
3. Wait for the port to accept connections.
4. Create role `processor` and DB `processor` (skipped if they exist).
5. Run every SQL file under `sql/` as the `processor` user.

---

## Windows (PowerShell 5.1+)

Install PostgreSQL from <https://www.postgresql.org/download/windows/> and add `psql.exe` to your `PATH`.

```powershell
# Required: set the postgres superuser password you chose during install.
$env:PGPASSWORD = '<your-postgres-superuser-password>'

# Optional overrides:
$env:ADMIN_PASSWORD = 'StrongDevPw#1!'

# Run (allow scripts once per session)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\server\scripts\db_setup.ps1
```

---

## Environment variables (both scripts)

| Variable         | Default          | Purpose                                                            |
| ---------------- | ---------------- | ------------------------------------------------------------------ |
| `DB_NAME`        | `processor`      | Database name (matches `application.yml`).                         |
| `DB_USER`        | `processor`      | App role name.                                                     |
| `DB_PASSWORD`    | `processor`      | App role password.                                                 |
| `DB_HOST`        | `localhost`      | DB host.                                                           |
| `DB_PORT`        | `5432`           | DB port.                                                           |
| `ADMIN_PASSWORD` | `ChangeMe!2026`  | Password seeded into the `admin` user. **Change before non-dev.** |
| `PG_SUPERUSER`   | `postgres`       | Windows only — superuser used for role / DB creation.              |
| `PGPASSWORD`     | _(empty)_        | Windows only — password for `PG_SUPERUSER`.                        |

---

## What the admin user can do

A single user is seeded on first run:

- **Username:** `admin`
- **Email:** `admin@processor.local`
- **Password:** value of `ADMIN_PASSWORD` (hashed with BCrypt cost 12 via `pgcrypto.crypt()`)
- **Roles:** `SUPER_ADMIN` (holds every permission in the catalog)

Login accepts **either** the username or email, case-insensitively (enforced by the unique indexes on `LOWER(username)` / `LOWER(email)`).

---

## Roles and permissions

| Role         | Permission set                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------- |
| SUPER_ADMIN  | Every permission.                                                                                   |
| ADMIN        | Every permission except `USERS_DELETE`.                                                             |
| ANALYST      | Read on transactions/batches/reports/audit logs/master data. Write on own activity log.             |
| OPERATOR     | Read/write on transactions and batches. Read on reports and master data. Write on own activity log. |
| VIEWER       | Read on transactions/batches/reports. Write on own activity log.                                    |

Extend/adjust freely in `08_seed_roles.sql` — the `INSERT ... ON CONFLICT DO NOTHING` pattern means re-running the script will only add newly listed entries, not overwrite rows a human changed in the DB.

---

## Design notes (for when you read the SQL)

- **UUID primary keys everywhere.** Generated by the DB via `gen_random_uuid()` (pgcrypto) so inserts don't need to supply them.
- **BCrypt via `pgcrypto`.** `crypt(:admin_password, gen_salt('bf', 12))` produces a hash Spring Security's `BCryptPasswordEncoder.matches()` can verify.
- **Card numbers are never stored in full.** Only `card_first4` + `card_last4`. Enforced by `CHECK (card_first4 ~ '^[0-9]{4}$')` etc.
- **Amounts can be negative.** `NUMERIC(19, 4)`, no positivity check — chargebacks / reversals are valid business data.
- **Source discriminator.** Each transaction (and batch) has `source IN ('BATCH','MANUAL')`. Manual entries leave `batch_id` NULL; uploads point to their parent batch.
- **Audit columns everywhere.** `created_at`, `updated_at`, `created_by`, `updated_by`, `version` (optimistic locking).
- **Activity logs** support both server-written events and client-posted events; a unified schema with `action`, `resource_type`, `resource_id`, and a flexible `metadata` JSONB column.
- **Indexes** are defined on every foreign key and on the columns used by the dashboard queries (occurred_at DESC, card_brand, date_trunc('day', occurred_at)).

---

## Migration path to Flyway (future)

The layout is intentionally compatible with Flyway:

1. Rename files to `V1__<descriptive_name>.sql`, `V2__...`, etc.
2. Add `spring-boot-starter-flyway` + `flyway-database-postgresql` to `processor-api/pom.xml`.
3. Remove the `IF NOT EXISTS` / `ON CONFLICT DO NOTHING` safety nets (Flyway tracks applied versions in `flyway_schema_history`).
4. Delete `db_setup.sh` / `db_setup.ps1` — Flyway runs on application startup.

The schema stays identical; only the delivery mechanism changes.
