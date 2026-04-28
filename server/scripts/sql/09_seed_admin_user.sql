-- ============================================================
-- 09_seed_admin_user.sql
-- Seed RBAC test users for local / Postman. Idempotent.
--
-- password_hash values are Spring/Java BCrypt ($2a$12$...) — NOT computed in SQL.
-- Set Postman `seedPassword` (and clients) to the **plaintext you used in Java**
-- when generating these hashes (often one password shared across users).
--
-- Re-run updates: INSERTs skip existing usernames; UPDATE block refreshes hashes.
--
--   admin      — SUPER_ADMIN
--   org_admin  — ADMIN
--   operator   — OPERATOR
--   analyst    — ANALYST
--   viewer     — VIEWER
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
    '$2a$12$yBMQq6tHjNbvQFXffT6hwupBiPDDUDlHRQGhN23.bcd0XLRLBc0De',
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
    '$2a$12$.z4J.0gsQ/0FL6ZkmkqlNuToMIynaJLsHxD1b4fL3Udq/vNLoDh3S',
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
    '$2a$12$Cd666TeAIkImiC28viNCKe27I6EEoQUYXpKUvHLMEtCL/kgWkVKFW',
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
    '$2a$12$2AATECVvIfnd5uxAz2RT0eMEIzPK8a1xzj75PBflby0BcF4DF.pUW',
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
    '$2a$12$Xccxf.FLENnIVJMcUr2g9uOj7jqnSMc9hz4wziR0VN.cMBbnf/uVC',
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

-- Keep hashes in this file authoritative when db_setup is re-run
UPDATE users SET password_hash = '$2a$12$yBMQq6tHjNbvQFXffT6hwupBiPDDUDlHRQGhN23.bcd0XLRLBc0De', password_updated_at = now()
WHERE LOWER(username) = 'admin';
UPDATE users SET password_hash = '$2a$12$.z4J.0gsQ/0FL6ZkmkqlNuToMIynaJLsHxD1b4fL3Udq/vNLoDh3S', password_updated_at = now()
WHERE LOWER(username) = 'org_admin';
UPDATE users SET password_hash = '$2a$12$Cd666TeAIkImiC28viNCKe27I6EEoQUYXpKUvHLMEtCL/kgWkVKFW', password_updated_at = now()
WHERE LOWER(username) = 'operator';
UPDATE users SET password_hash = '$2a$12$2AATECVvIfnd5uxAz2RT0eMEIzPK8a1xzj75PBflby0BcF4DF.pUW', password_updated_at = now()
WHERE LOWER(username) = 'analyst';
UPDATE users SET password_hash = '$2a$12$Xccxf.FLENnIVJMcUr2g9uOj7jqnSMc9hz4wziR0VN.cMBbnf/uVC', password_updated_at = now()
WHERE LOWER(username) = 'viewer';
