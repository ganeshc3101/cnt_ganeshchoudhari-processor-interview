import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/app/providers/AuthProvider';
import { PageSkeleton } from '@/shared/ui/Skeleton';

import { paths } from '../paths';

type Props = {
  permission: string;
};

/**
 * Route guard — requires a single permission. Redirects to dashboard if missing.
 */
export function RequirePermission({ permission }: Props) {
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) return <PageSkeleton />;

  if (!hasPermission(permission)) {
    return <Navigate to={paths.dashboard} replace />;
  }

  return <Outlet />;
}
