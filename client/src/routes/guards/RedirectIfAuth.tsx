import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/app/providers/AuthProvider';
import { PageSkeleton } from '@/shared/ui/Skeleton';

import { paths } from '../paths';

export function RedirectIfAuth() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <PageSkeleton />;

  if (session) {
    return <Navigate to={paths.dashboard} replace />;
  }

  return <Outlet />;
}
