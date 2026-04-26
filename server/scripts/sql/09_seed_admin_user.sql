-- ============================================================
-- 09_seed_admin_user.sql
-- Seed test users (same password) for local / Postman scenarios.
-- Password is passed by the bootstrap script as psql variable :admin_password
-- (NEVER hard-code here). BCrypt via pgcrypto; Spring Security verifies.
--
-- Users (all use ADMIN_PASSWORD from db_setup / db_setup.ps1):
--   admin       — SUPER_ADMIN (full access, incl. hypothet. USERS_DELETE)
--   org_admin   — ADMIN (all perms except USERS_DELETE; same API as super here)
--   operator    — OPERATOR (txn/batch write, no AUDIT_LOGS_READ)
--   analyst     — ANALYST (read-only txns, has AUDIT_LOGS_READ, no TXN write)
--   viewer      — VIEWER (read txns/reports, no AUDIT_LOGS_READ, no batch write)
--
-- See server/postman/Processor-API.postman_collection.json for scenarios.
-- ============================================================

-- ---------- admin (SUPER_ADMIN) ----------
INSERT INTO users (
    id,
    username,
    email,
    password_hash,
    first_name,
    last_name,
    display_name,
    status,
    email_verified_at,
    password_updated_at
)
SELECT
    gen_random_uuid(),
    'admin',
    'admin@processor.local',
    crypt(:'admin_password', gen_salt('bf', 12)),
    'System',
    'Administrator',
    'System Administrator',
    'ACTIVE',
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE LOWER(username) = 'admin'
);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'SUPER_ADMIN'
WHERE LOWER(u.username) = 'admin'
ON CONFLICT DO NOTHING;

-- ---------- org_admin (ADMIN) ----------
INSERT INTO users (
    id, username, email, password_hash, first_name, last_name, display_name,
    status, email_verified_at, password_updated_at
)
SELECT
    gen_random_uuid(),
    'org_admin',
    'org_admin@processor.local',
    crypt(:'admin_password', gen_salt('bf', 12)),
    'Org',
    'Administrator',
    'Organization Administrator',
    'ACTIVE', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(username) = 'org_admin');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'ADMIN'
WHERE LOWER(u.username) = 'org_admin'
ON CONFLICT DO NOTHING;

-- ---------- operator (OPERATOR) ----------
INSERT INTO users (
    id, username, email, password_hash, first_name, last_name, display_name,
    status, email_verified_at, password_updated_at
)
SELECT
    gen_random_uuid(),
    'operator',
    'operator@processor.local',
    crypt(:'admin_password', gen_salt('bf', 12)),
    'Batch',
    'Operator',
    'Transaction Operator',
    'ACTIVE', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(username) = 'operator');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'OPERATOR'
WHERE LOWER(u.username) = 'operator'
ON CONFLICT DO NOTHING;

-- ---------- analyst (ANALYST) ----------
INSERT INTO users (
    id, username, email, password_hash, first_name, last_name, display_name,
    status, email_verified_at, password_updated_at
)
SELECT
    gen_random_uuid(),
    'analyst',
    'analyst@processor.local',
    crypt(:'admin_password', gen_salt('bf', 12)),
    'Read',
    'Analyst',
    'Reporting Analyst',
    'ACTIVE', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(username) = 'analyst');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'ANALYST'
WHERE LOWER(u.username) = 'analyst'
ON CONFLICT DO NOTHING;

-- ---------- viewer (VIEWER) ----------
INSERT INTO users (
    id, username, email, password_hash, first_name, last_name, display_name,
    status, email_verified_at, password_updated_at
)
SELECT
    gen_random_uuid(),
    'viewer',
    'viewer@processor.local',
    crypt(:'admin_password', gen_salt('bf', 12)),
    'Casual',
    'Viewer',
    'Read-only Viewer',
    'ACTIVE', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(username) = 'viewer');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'VIEWER'
WHERE LOWER(u.username) = 'viewer'
ON CONFLICT DO NOTHING;
