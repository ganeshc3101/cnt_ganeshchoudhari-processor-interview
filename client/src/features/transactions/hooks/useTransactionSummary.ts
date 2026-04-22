import { useQuery } from '@tanstack/react-query';

import { transactionsKeys } from './queryKeys';
import { transactionsService } from '../services/transactionsService';


export function useTransactionSummary() {
  return useQuery({
    queryKey: transactionsKeys.summary(),
    queryFn: ({ signal }) => transactionsService.summary(signal),
  });
}
