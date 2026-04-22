import { buildSeedTransactions } from '../lib/seed';

import type { Transaction } from '../types/transaction';

/**
 * Module-private in-memory store. Simulates the persistence layer that will
 * later live behind the real `/transactions` API — do NOT import this from
 * outside this folder.
 */
let store: Transaction[] = buildSeedTransactions();

export const mockStore = {
  snapshot(): ReadonlyArray<Transaction> {
    return store;
  },
  addMany(next: ReadonlyArray<Transaction>) {
    store = [...next, ...store];
  },
  addOne(next: Transaction) {
    store = [next, ...store];
  },
  reset() {
    store = buildSeedTransactions();
  },
};
