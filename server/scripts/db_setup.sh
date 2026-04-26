#!/usr/bin/env bash
# ==============================================================
# db_setup.sh — macOS / Linux bootstrap for the Processor backend.
#
# Idempotent. Safe to re-run.
# - Ensures PostgreSQL is installed and running.
# - Creates role + database (skips if present).
# - Runs every SQL file in ./sql/ in lexical order.
# - Seeds master data, permissions, roles, and the admin user.
#
# Override defaults via env vars:
#   DB_NAME DB_USER DB_PASSWORD DB_HOST DB_PORT ADMIN_PASSWORD
# ==============================================================

set -euo pipefail

DB_NAME="${DB_NAME:-processor}"
DB_USER="${DB_USER:-processor}"
DB_PASSWORD="${DB_PASSWORD:-processor}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-ChangeMe!2026}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_DIR="$SCRIPT_DIR/sql"

log()  { printf '\033[1;34m[db-setup]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[db-setup]\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m[db-setup]\033[0m %s\n' "$*" >&2; }

OS="$(uname -s)"

ensure_postgres_running() {
  case "$OS" in
    Darwin)
      if ! command -v brew >/dev/null 2>&1; then
        err "Homebrew not found. Install from https://brew.sh"; exit 1
      fi
      if ! brew list --versions postgresql@16 >/dev/null 2>&1 \
         && ! brew list --versions postgresql    >/dev/null 2>&1; then
        log "Installing postgresql@16 via Homebrew..."
        brew install postgresql@16
      fi
      log "Starting PostgreSQL (brew services)..."
      brew services start postgresql@16 >/dev/null 2>&1 \
        || brew services start postgresql >/dev/null 2>&1 \
        || warn "brew services start reported non-zero; continuing."
      ;;
    Linux)
      if ! command -v psql >/dev/null 2>&1; then
        err "psql not installed. Run: sudo apt install postgresql postgresql-client"; exit 1
      fi
      if command -v systemctl >/dev/null 2>&1; then
        log "Starting postgresql.service..."
        sudo systemctl start postgresql || true
      fi
      ;;
    *) err "Unsupported OS: $OS"; exit 1 ;;
  esac
}

wait_for_postgres() {
  log "Waiting for Postgres on $DB_HOST:$DB_PORT..."
  for _ in $(seq 1 30); do
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -q 2>/dev/null; then
      log "Postgres is ready."
      return
    fi
    sleep 1
  done
  err "Postgres did not become ready within 30 seconds."
  exit 1
}

# Admin psql against 'postgres' DB.
# macOS Homebrew: current OS user is superuser.
# Linux: superuser is 'postgres'.
admin_psql() {
  case "$OS" in
    Darwin) psql -h "$DB_HOST" -p "$DB_PORT" -d postgres "$@" ;;
    Linux)  sudo -u postgres psql -h "$DB_HOST" -p "$DB_PORT" -d postgres "$@" ;;
  esac
}

admin_psql_db() {
  local db="$1"; shift
  case "$OS" in
    Darwin) psql -h "$DB_HOST" -p "$DB_PORT" -d "$db" "$@" ;;
    Linux)  sudo -u postgres psql -h "$DB_HOST" -p "$DB_PORT" -d "$db" "$@" ;;
  esac
}

user_psql() {
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" "$@"
}

ensure_role() {
  local exists
  exists=$(admin_psql -tAc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" || true)
  if [ "$exists" = "1" ]; then
    log "Role '$DB_USER' already exists."
  else
    log "Creating role '$DB_USER'..."
    admin_psql -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';" >/dev/null
  fi
}

ensure_database() {
  local exists
  exists=$(admin_psql -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" || true)
  if [ "$exists" = "1" ]; then
    log "Database '$DB_NAME' already exists."
  else
    log "Creating database '$DB_NAME' (owner: $DB_USER)..."
    admin_psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" >/dev/null
  fi
  admin_psql      -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" >/dev/null
  admin_psql_db "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"        >/dev/null
  admin_psql_db "$DB_NAME" -c "ALTER SCHEMA public OWNER TO $DB_USER;"         >/dev/null
}

apply_sql_files() {
  if [ "$ADMIN_PASSWORD" = "ChangeMe!2026" ]; then
    warn "ADMIN_PASSWORD is set to the default dev value. Change it before any non-dev use."
  fi

  shopt -s nullglob
  local files=("$SQL_DIR"/*.sql)
  shopt -u nullglob

  if [ "${#files[@]}" -eq 0 ]; then
    err "No SQL files found under $SQL_DIR"; exit 1
  fi

  for sql in "${files[@]}"; do
    local name
    name="$(basename "$sql")"
    log "Applying $name..."
    if [ "$name" = "09_seed_admin_user.sql" ]; then
      user_psql -v ON_ERROR_STOP=1 -v admin_password="$ADMIN_PASSWORD" -f "$sql"
    else
      user_psql -v ON_ERROR_STOP=1 -f "$sql"
    fi
  done
}

main() {
  ensure_postgres_running
  wait_for_postgres
  ensure_role
  ensure_database
  apply_sql_files
  log "Done. Database ready: postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
  log "Seeded app users (password = ADMIN_PASSWORD for all): admin, org_admin, operator, analyst, viewer"
  log "  Postman: server/postman/Processor-API.postman_collection.json + Processor-API.local.postman_environment.json"
}

main "$@"
