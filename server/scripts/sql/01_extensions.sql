-- ============================================================
-- 01_extensions.sql
--   pgcrypto provides:
--     - gen_random_uuid() for UUID primary keys
--     - crypt() / gen_salt('bf', n) for BCrypt password hashing
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
