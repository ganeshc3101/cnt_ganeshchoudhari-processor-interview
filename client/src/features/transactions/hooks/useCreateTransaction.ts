import { useMutation, useQueryClient } from '@tanstack/react-query';

import { transactionsKeys } from './queryKeys';
import { transactionsService } from '../services/transactionsService';

import type { CreateTransactionInput, Transaction } from '../types/transaction';


export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation<Transaction, Error, CreateTransactionInput>({
    mutationFn: (input) => transactionsService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transactionsKeys.all });
    },
  });
}
