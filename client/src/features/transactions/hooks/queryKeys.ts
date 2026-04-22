import type { TransactionFilters } from '../types/transaction';

export const transactionsKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionsKeys.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...transactionsKeys.lists(), filters] as const,
  summary: () => [...transactionsKeys.all, 'summary'] as const,
};
