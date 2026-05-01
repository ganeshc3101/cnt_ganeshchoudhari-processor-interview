/**
 * Permission codes aligned with backend seed (`07_seed_permissions.sql`).
 * Use these instead of string literals in UI and guards.
 */
export const PERMISSIONS = {
  USERS_READ: 'USERS_READ',
  USERS_WRITE: 'USERS_WRITE',
  USERS_DELETE: 'USERS_DELETE',
  USERS_ADMIN: 'USERS_ADMIN',
  ROLES_READ: 'ROLES_READ',
  ROLES_WRITE: 'ROLES_WRITE',
  ROLES_ADMIN: 'ROLES_ADMIN',
  TRANSACTIONS_READ: 'TRANSACTIONS_READ',
  TRANSACTIONS_WRITE: 'TRANSACTIONS_WRITE',
  TRANSACTIONS_DELETE: 'TRANSACTIONS_DELETE',
  BATCHES_READ: 'BATCHES_READ',
  BATCHES_WRITE: 'BATCHES_WRITE',
  BATCHES_DELETE: 'BATCHES_DELETE',
  REPORTS_READ: 'REPORTS_READ',
  AUDIT_LOGS_READ: 'AUDIT_LOGS_READ',
  AUDIT_LOGS_WRITE: 'AUDIT_LOGS_WRITE',
  MASTER_DATA_READ: 'MASTER_DATA_READ',
  MASTER_DATA_WRITE: 'MASTER_DATA_WRITE',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ANALYST: 'ANALYST',
  OPERATOR: 'OPERATOR',
  VIEWER: 'VIEWER',
} as const;

export function permissionSetIncludes(
  permissionCodes: readonly string[],
  permission: string,
): boolean {
  return permissionCodes.includes(permission);
}

export function permissionSetIncludesAny(
  permissionCodes: readonly string[],
  permissions: readonly string[],
): boolean {
  return permissions.some((p) => permissionCodes.includes(p));
}

export function roleSetIncludes(roleCodes: readonly string[], role: string): boolean {
  return roleCodes.includes(role);
}
