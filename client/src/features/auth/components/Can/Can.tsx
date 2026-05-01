import { useAuth } from '@/app/providers/AuthProvider';

import type { ReactNode } from 'react';

type Props =
  | { permission: string; anyOf?: never; children: ReactNode }
  | { anyOf: readonly string[]; permission?: never; children: ReactNode };

/**
 * Renders `children` only when the current user has the required permission(s).
 * If unauthorized, renders nothing (component tree for `children` is not mounted).
 */
export function Can(props: Props) {
  const { hasPermission, hasAnyPermission } = useAuth();

  if ('permission' in props && props.permission.length > 0) {
    if (!hasPermission(props.permission)) return null;
  } else if (props.anyOf && props.anyOf.length > 0) {
    if (!hasAnyPermission(props.anyOf)) return null;
  }

  return props.children;
}
