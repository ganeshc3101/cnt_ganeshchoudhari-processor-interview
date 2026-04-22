import { useMutation, useQueryClient } from '@tanstack/react-query';

import { transactionsKeys } from './queryKeys';
import { transactionsService } from '../services/transactionsService';

import type { CreateManyResult, CreateTransactionInput } from '../types/transaction';

export function useCreateManyTransactions() {
  const queryClient = useQueryClient();
  return useMutation<CreateManyResult, Error, ReadonlyArray<CreateTransactionInput>>({
    mutationFn: (inputs) => transactionsService.createMany(inputs),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transactionsKeys.all });
    },
  });
}
