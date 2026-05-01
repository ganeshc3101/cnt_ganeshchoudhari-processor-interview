import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  clearAccessToken,
  clearLegacyMockSession,
  getAccessToken,
} from '@/features/auth/lib/authTokenStorage';
import {
  permissionSetIncludes,
  permissionSetIncludesAny,
  roleSetIncludes,
} from '@/features/auth/lib/permissions';
import { authService } from '@/features/auth/services/authService';
import { configureApiClientAuth } from '@/shared/api/apiClient';

import type { LoginFormValues, Session } from '@/features/auth/types/auth';

type AuthContextValue = {
  session: Session | null;
  user: Session['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (values: LoginFormValues) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: readonly string[]) => boolean;
  hasRole: (role: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resetClientState = useCallback(() => {
    queryClient.clear();
    setSession(null);
  }, [queryClient]);

  /** Clears token + React Query + session (401 / forced logout). */
  const purgeAuth = useCallback(() => {
    clearAccessToken();
    resetClientState();
  }, [resetClientState]);

  useEffect(() => {
    configureApiClientAuth({
      getAccessToken,
      onUnauthorized: purgeAuth,
    });
    return () => configureApiClientAuth(null);
  }, [purgeAuth]);

  useEffect(() => {
    let cancelled = false;
    clearLegacyMockSession();

    const bootstrap = async () => {
      try {
        const user = await authService.getStoredSessionUser();
        if (cancelled) return;
        if (user) {
          setSession({ authenticated: true, user });
        } else {
          setSession(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const permissionCodes = useMemo(
    () => session?.user.permissionCodes ?? [],
    [session],
  );
  const roleCodes = useMemo(() => session?.user.roleCodes ?? [], [session]);

  const hasPermission = useCallback(
    (permission: string) => permissionSetIncludes(permissionCodes, permission),
    [permissionCodes],
  );

  const hasAnyPermission = useCallback(
    (permissions: readonly string[]) =>
      permissionSetIncludesAny(permissionCodes, permissions),
    [permissionCodes],
  );

  const hasRole = useCallback(
    (role: string) => roleSetIncludes(roleCodes, role),
    [roleCodes],
  );

  const signIn = useCallback(async (values: LoginFormValues) => {
    const user = await authService.login(values);
    setSession({ authenticated: true, user });
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    resetClientState();
  }, [resetClientState]);

  const refreshProfile = useCallback(async () => {
    const user = await authService.fetchMe();
    setSession({ authenticated: true, user });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      isLoading,
      signIn,
      signOut,
      refreshProfile,
      hasPermission,
      hasAnyPermission,
      hasRole,
    }),
    [
      session,
      isLoading,
      signIn,
      signOut,
      refreshProfile,
      hasPermission,
      hasAnyPermission,
      hasRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>.');
  }
  return ctx;
}
