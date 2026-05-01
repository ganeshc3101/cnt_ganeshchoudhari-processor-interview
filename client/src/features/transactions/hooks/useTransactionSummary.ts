import { useQuery } from '@tanstack/react-query';

import { transactionsKeys } from './queryKeys';
import { fetchDashboardSummary } from '../services/reportsService';

export function useTransactionSummary() {
  return useQuery({
    queryKey: transactionsKeys.summary(),
    queryFn: ({ signal }) => fetchDashboardSummary(signal),
  });
}
