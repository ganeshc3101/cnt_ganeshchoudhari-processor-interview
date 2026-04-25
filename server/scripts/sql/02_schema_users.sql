-- ============================================================
-- 02_schema_users.sql
-- Users, RBAC (roles, permissions, mappings), and auth_sessions.
-- ============================================================

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
    id                      UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    username                VARCHAR(64)    NOT NULL,
    email                   VARCHAR(254)   NOT NULL,
    password_hash           VARCHAR(72)    NOT NULL,
    first_name              VARCHAR(64),
    last_name               VARCHAR(64),
    display_name            VARCHAR(128),
    phone                   VARCHAR(32),
    avatar_url              TEXT,
    status                  VARCHAR(16)    NOT NULL DEFAULT 'ACTIVE',
    email_verified_at       TIMESTAMPTZ,
    last_login_at           TIMESTAMPTZ,
    failed_login_attempts   INTEGER        NOT NULL DEFAULT 0,
    password_updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    created_at              TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ    NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_by              UUID,
    version                 BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT users_status_chk CHECK (status IN ('ACTIVE','LOCKED','DISABLED','PENDING'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_lower ON users (LOWER(username));
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower    ON users (LOWER(email));
CREATE INDEX        IF NOT EXISTS idx_users_status        ON users (status);
CREATE INDEX        IF NOT EXISTS idx_users_created_at    ON users (created_at DESC);

-- Self-reference FKs for audit columns (added via DO block so the script stays idempotent).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_created_by') THEN
        ALTER TABLE users
            ADD CONSTRAINT fk_users_created_by
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_updated_by') THEN
        ALTER TABLE users
            ADD CONSTRAINT fk_users_updated_by
            FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- ---------- roles ----------
CREATE TABLE IF NOT EXISTS roles (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    code         VARCHAR(64)    NOT NULL UNIQUE,
    name         VARCHAR(128)   NOT NULL,
    description  TEXT,
    is_system    BOOLEAN        NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    created_by   UUID,
    updated_by   UUID,
    version      BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT fk_roles_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_roles_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles (is_system);

-- ---------- permissions ----------
CREATE TABLE IF NOT EXISTS permissions (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    code         VARCHAR(128)   NOT NULL UNIQUE,
    resource     VARCHAR(64)    NOT NULL,
    action       VARCHAR(32)    NOT NULL,
    description  TEXT,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT permissions_resource_action_unique UNIQUE (resource, action),
    CONSTRAINT permissions_action_chk CHECK (action IN ('READ','WRITE','DELETE','ADMIN'))
);

CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions (resource);

-- ---------- role_permissions (M:N) ----------
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id        UUID          NOT NULL,
    permission_id  UUID          NOT NULL,
    granted_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    granted_by     UUID,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role       FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_granted_by FOREIGN KEY (granted_by)    REFERENCES users(id)       ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions (permission_id);

-- ---------- user_roles (M:N) ----------
CREATE TABLE IF NOT EXISTS user_roles (
    user_id      UUID          NOT NULL,
    role_id      UUID          NOT NULL,
    assigned_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    assigned_by  UUID,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user        FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role        FOREIGN KEY (role_id)     REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles (role_id);

-- ---------- auth_sessions ----------
-- Tracks JWT jti for optional revocation / audit. Stateless auth stays stateless —
-- this table is only consulted if the jti denylist feature is turned on.
CREATE TABLE IF NOT EXISTS auth_sessions (
    id            UUID           PRIMARY KEY,     -- jti
    user_id       UUID           NOT NULL,
    issued_at     TIMESTAMPTZ    NOT NULL,
    expires_at    TIMESTAMPTZ    NOT NULL,
    revoked_at    TIMESTAMPTZ,
    client_ip     INET,
    user_agent    TEXT,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_exp ON auth_sessions (user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_expires  ON auth_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked  ON auth_sessions (revoked_at) WHERE revoked_at IS NOT NULL;
