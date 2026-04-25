-- ============================================================
-- 08_seed_roles.sql
-- System roles + role_permissions mapping (idempotent).
-- ============================================================

INSERT INTO roles (code, name, description, is_system) VALUES
    ('SUPER_ADMIN', 'Super Administrator',
        'Full system access including user and role administration.',        true),
    ('ADMIN',       'Administrator',
        'Administrative access without user deletion.',                      true),
    ('ANALYST',     'Analyst',
        'Read-only access to transactions, batches, reports, and audit logs.', true),
    ('OPERATOR',    'Operator',
        'Create and view transactions/batches. Read reports.',               true),
    ('VIEWER',      'Viewer',
        'Read-only access to transactions, batches, and reports.',           true)
ON CONFLICT (code) DO NOTHING;

-- SUPER_ADMIN → every permission.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- ADMIN → every permission except USERS_DELETE.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
  AND p.code <> 'USERS_DELETE'
ON CONFLICT DO NOTHING;

-- ANALYST → read-only across the business surface.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'TRANSACTIONS_READ',
    'BATCHES_READ',
    'REPORTS_READ',
    'AUDIT_LOGS_READ',
    'AUDIT_LOGS_WRITE',
    'MASTER_DATA_READ'
)
WHERE r.code = 'ANALYST'
ON CONFLICT DO NOTHING;

-- OPERATOR → R/W on transactions and batches, R on reports + master data.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'TRANSACTIONS_READ',
    'TRANSACTIONS_WRITE',
    'BATCHES_READ',
    'BATCHES_WRITE',
    'REPORTS_READ',
    'AUDIT_LOGS_WRITE',
    'MASTER_DATA_READ'
)
WHERE r.code = 'OPERATOR'
ON CONFLICT DO NOTHING;

-- VIEWER → read on transactions/batches/reports and write on own activity log.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'TRANSACTIONS_READ',
    'BATCHES_READ',
    'REPORTS_READ',
    'AUDIT_LOGS_WRITE'
)
WHERE r.code = 'VIEWER'
ON CONFLICT DO NOTHING;
