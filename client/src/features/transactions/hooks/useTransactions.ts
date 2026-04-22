import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { transactionsKeys } from './queryKeys';
import { transactionsService } from '../services/transactionsService';

import type { TransactionFilters } from '../types/transaction';


export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: transactionsKeys.list(filters),
    queryFn: ({ signal }) => transactionsService.list(filters, signal),
    placeholderData: keepPreviousData,
  });
}
