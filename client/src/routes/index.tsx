import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import { NotFoundPage } from '@/app/router/NotFoundPage';

import { DefaultRedirect } from './DefaultRedirect';
import { RedirectIfAuth } from './guards/RedirectIfAuth';
import { RequireAuth } from './guards/RequireAuth';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { paths } from './paths';

const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);

const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({
    default: m.DashboardPage,
  })),
);

const ProfilePage = lazy(() =>
  import('@/features/auth/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);

export const AppRoutes = () => (
  <Routes>
    {/* Public auth routes — redirect away if already authenticated */}
    <Route element={<AuthLayout />}>
      <Route element={<RedirectIfAuth />}>
        <Route path={paths.login} element={<LoginPage />} />
      </Route>
    </Route>

    {/* Protected routes — require authentication */}
    <Route element={<RequireAuth />}>
      <Route element={<AppLayout />}>
        <Route index element={<DefaultRedirect />} />
        <Route path={paths.dashboard} element={<DashboardPage />} />
        <Route path={paths.profile} element={<ProfilePage />} />
      </Route>
    </Route>

    <Route path={paths.notFound} element={<NotFoundPage />} />
  </Routes>
);
