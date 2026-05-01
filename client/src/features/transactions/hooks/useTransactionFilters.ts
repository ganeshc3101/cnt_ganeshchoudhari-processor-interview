import { useCallback, useMemo } from 'react';

import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useUrlState } from '@/shared/hooks/useUrlState';

import { TransactionFiltersSchema, type TransactionFilters } from '../types/transaction';

export type TransactionFiltersUpdate = Partial<Omit<TransactionFilters, 'page'>>;

export type UseTransactionFiltersReturn = {
  /** Immediate values for controlled inputs. */
  rawFilters: TransactionFilters;
  /** Debounced, query-safe filters to feed into queries. */
  queryFilters: TransactionFilters;
  /** Merge an update; resets pagination to page 1 when not explicitly set. */
  setFilters: (update: TransactionFiltersUpdate) => void;
  /** Change the active page without clearing filters. */
  setPage: (nextPage: number) => void;
  resetFilters: () => void;
};

export function useTransactionFilters(): UseTransactionFiltersReturn {
  const [rawFilters, setParams] = useUrlState(TransactionFiltersSchema);

  const debouncedMin = useDebouncedValue(rawFilters.minAmount, 300);
  const debouncedMax = useDebouncedValue(rawFilters.maxAmount, 300);

  const queryFilters = useMemo<TransactionFilters>(
    () => ({
      ...rawFilters,
      minAmount: debouncedMin,
      maxAmount: debouncedMax,
    }),
    [rawFilters, debouncedMin, debouncedMax],
  );

  const setFilters = useCallback(
    (update: TransactionFiltersUpdate) => {
      const touchesDataFilter = Object.keys(update).some(
        (key) => key !== 'pageSize' && key !== 'page',
      );
      setParams({ ...update, ...(touchesDataFilter ? { page: 1 } : {}) });
    },
    [setParams],
  );

  const setPage = useCallback((nextPage: number) => setParams({ page: nextPage }), [setParams]);

  const resetFilters = useCallback(() => {
    setParams({
      cardTypes: [],
      from: '',
      to: '',
      minAmount: '',
      maxAmount: '',
      page: 1,
    });
  }, [setParams]);

  return { rawFilters, queryFilters, setFilters, setPage, resetFilters };
}
