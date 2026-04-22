import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/app/config/queryClient';

import type { ReactNode } from 'react';


type Props = {
  children: ReactNode;
};

export function QueryProvider({ children }: Props) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
