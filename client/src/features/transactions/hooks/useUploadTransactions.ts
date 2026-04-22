import { useMutation, useQueryClient } from '@tanstack/react-query';

import { transactionsKeys } from './queryKeys';
import { transactionsService } from '../services/transactionsService';

import type { UploadResult } from '../types/transaction';


export function useUploadTransactions() {
  const queryClient = useQueryClient();
  return useMutation<UploadResult, Error, ReadonlyArray<File>>({
    mutationFn: (files) => transactionsService.uploadFiles(files),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transactionsKeys.all });
    },
  });
}
