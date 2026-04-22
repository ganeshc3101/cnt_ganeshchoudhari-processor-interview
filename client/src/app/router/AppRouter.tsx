import { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { AppRoutes } from '@/routes';
import { PageSkeleton } from '@/shared/ui/Skeleton';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  );
}
