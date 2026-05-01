import { Outlet } from 'react-router-dom';

import { useAuth } from '@/app/providers/AuthProvider';
import { PageSkeleton } from '@/shared/ui/Skeleton';

import { DefaultRedirect } from '../DefaultRedirect';

export function RedirectIfAuth() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <PageSkeleton />;

  if (session) {
    return <DefaultRedirect />;
  }

  return <Outlet />;
}
