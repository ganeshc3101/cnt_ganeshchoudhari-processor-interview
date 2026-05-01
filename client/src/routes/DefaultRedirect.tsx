import { Navigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/AuthProvider';
import { PERMISSIONS } from '@/features/auth';

import { paths } from './paths';

/**
 * Sends `/` to the first meaningful destination based on permissions.
 */
export function DefaultRedirect() {
  const { hasAnyPermission } = useAuth();
  const canSeeDashboard = hasAnyPermission([
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.TRANSACTIONS_READ,
    PERMISSIONS.BATCHES_WRITE,
    PERMISSIONS.TRANSACTIONS_WRITE,
  ]);
  return <Navigate to={canSeeDashboard ? paths.dashboard : paths.profile} replace />;
}
