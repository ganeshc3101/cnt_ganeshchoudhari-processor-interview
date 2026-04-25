-- ============================================================
-- 04_schema_activity.sql
-- Single activity_logs table used for:
--   - Server-side auditing (login, logout, txn create/update, etc.)
--   - Client-reported user activity (posted via the activity API)
-- Indexed by time, user, action, and resource.
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID,
    username        VARCHAR(64),      -- snapshot in case the user is deleted later
    action          VARCHAR(64)    NOT NULL,
    resource_type   VARCHAR(32),
    resource_id     UUID,
    status          VARCHAR(16)    NOT NULL,
    http_method     VARCHAR(8),
    http_path       VARCHAR(255),
    http_status     SMALLINT,
    client_ip       INET,
    user_agent      TEXT,
    request_id      VARCHAR(64),
    message         TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT al_status_chk CHECK (status IN ('SUCCESS','FAILURE')),
    CONSTRAINT fk_al_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_al_created_at    ON activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_al_user_time     ON activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_al_action_time   ON activity_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_al_resource      ON activity_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_al_request_id    ON activity_logs (request_id);
CREATE INDEX IF NOT EXISTS idx_al_status_time   ON activity_logs (status, created_at DESC);
