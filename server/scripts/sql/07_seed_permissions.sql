-- ============================================================
-- 07_seed_permissions.sql
-- Permission catalog: one row per (resource, action).
-- Code convention: <RESOURCE>_<ACTION>.
-- ============================================================

INSERT INTO permissions (code, resource, action, description) VALUES
    ('USERS_READ',         'USERS',        'READ',   'View users'),
    ('USERS_WRITE',        'USERS',        'WRITE',  'Create and update users'),
    ('USERS_DELETE',       'USERS',        'DELETE', 'Delete users'),
    ('USERS_ADMIN',        'USERS',        'ADMIN',  'Administer users (assign roles, reset passwords)'),

    ('ROLES_READ',         'ROLES',        'READ',   'View roles'),
    ('ROLES_WRITE',        'ROLES',        'WRITE',  'Create and update roles'),
    ('ROLES_ADMIN',        'ROLES',        'ADMIN',  'Administer role-permission mappings'),

    ('TRANSACTIONS_READ',  'TRANSACTIONS', 'READ',   'View transactions'),
    ('TRANSACTIONS_WRITE', 'TRANSACTIONS', 'WRITE',  'Create manual transactions'),
    ('TRANSACTIONS_DELETE','TRANSACTIONS', 'DELETE', 'Delete transactions'),

    ('BATCHES_READ',       'BATCHES',      'READ',   'View upload batches'),
    ('BATCHES_WRITE',      'BATCHES',      'WRITE',  'Upload transaction batches'),
    ('BATCHES_DELETE',     'BATCHES',      'DELETE', 'Delete upload batches'),

    ('REPORTS_READ',       'REPORTS',      'READ',   'View dashboard reports'),

    ('AUDIT_LOGS_READ',    'AUDIT_LOGS',   'READ',   'View user activity / audit logs'),
    ('AUDIT_LOGS_WRITE',   'AUDIT_LOGS',   'WRITE',  'Post client-side user activity events'),

    ('MASTER_DATA_READ',   'MASTER_DATA',  'READ',   'View master data (card brands, currencies)'),
    ('MASTER_DATA_WRITE',  'MASTER_DATA',  'WRITE',  'Manage master data')
ON CONFLICT (code) DO NOTHING;
