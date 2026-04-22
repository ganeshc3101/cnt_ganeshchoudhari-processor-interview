
import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';

import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
