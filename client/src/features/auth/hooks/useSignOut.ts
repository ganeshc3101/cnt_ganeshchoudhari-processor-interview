import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/AuthProvider';
import { paths } from '@/routes/paths';

export function useSignOut() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return useCallback(async () => {
    await signOut();
    navigate(paths.login, { replace: true });
  }, [signOut, navigate]);
}
