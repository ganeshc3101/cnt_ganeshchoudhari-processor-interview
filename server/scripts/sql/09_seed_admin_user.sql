-- ============================================================
-- 09_seed_admin_user.sql
-- Seed a default SUPER_ADMIN user on first run. Idempotent.
-- Password is passed by the bootstrap script as psql variable :admin_password
-- (NEVER hard-coded here). BCrypt hash is generated via pgcrypto.
--
-- !!! Change ADMIN_PASSWORD before any non-dev use !!!
-- ============================================================

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

-- Assign SUPER_ADMIN role to the admin user (idempotent).
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'SUPER_ADMIN'
WHERE LOWER(u.username) = 'admin'
ON CONFLICT DO NOTHING;
