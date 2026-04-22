import { majorToMinor } from '@/shared/lib/money';

import { mockStore } from './mockStore';
import { classifyCardType } from '../lib/cardType';
import { parseUploadFile } from '../lib/parseUpload';
import {
  CARD_TYPES,
  CreateManyResultSchema,
  TransactionListResponseSchema,
  TransactionSchema,
  TransactionSummarySchema,
  UploadResultSchema,
  type CreateManyResult,
  type CreateTransactionInput,
  type Transaction,
  type TransactionFilters,
  type TransactionListResponse,
  type TransactionSummary,
  type UploadResult,
} from '../types/transaction';


/**
 * Simulated network latency — keeps loading states realistic in the UI and
 * mirrors how the real endpoints will feel. The delay is intentionally short
 * so tests stay fast.
 */
const SIMULATED_LATENCY_MS = 180;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const id = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(id);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

function toAmountMinor(raw: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) return null;
  return majorToMinor(Number(raw));
}

function applyFilters(
  source: ReadonlyArray<Transaction>,
  filters: Pick<
    TransactionFilters,
    'q' | 'cardTypes' | 'from' | 'to' | 'minAmount' | 'maxAmount'
  >,
): Transaction[] {
  const q = filters.q.replace(/\s+/g, '').toLowerCase();
  const minMinor = filters.minAmount ? toAmountMinor(filters.minAmount) : null;
  const maxMinor = filters.maxAmount ? toAmountMinor(filters.maxAmount) : null;
  const fromTs = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : null;
  const toTs = filters.to ? new Date(`${filters.to}T23:59:59.999`).getTime() : null;

  const cardTypes = filters.cardTypes;
  const hasCardTypeFilter = cardTypes.length > 0;
  const wantsRejected = hasCardTypeFilter && cardTypes.includes('REJECTED');
  const brandFilters = hasCardTypeFilter
    ? new Set(cardTypes.filter((type) => type !== 'REJECTED'))
    : null;

  return source.filter((tx) => {
    if (hasCardTypeFilter) {
      const brandMatch = brandFilters && brandFilters.size > 0 && tx.cardType !== null
        ? brandFilters.has(tx.cardType)
        : false;
      const rejectedMatch = wantsRejected && tx.status === 'REJECTED';
      if (!brandMatch && !rejectedMatch) return false;
    }

    if (fromTs !== null && new Date(tx.occurredAt).getTime() < fromTs) return false;
    if (toTs !== null && new Date(tx.occurredAt).getTime() > toTs) return false;

    if (minMinor !== null && tx.amountMinor < minMinor) return false;
    if (maxMinor !== null && tx.amountMinor > maxMinor) return false;

    if (q.length > 0) {
      const cardDigits = tx.cardNumber.toLowerCase();
      const amountText = (tx.amountMinor / 100).toFixed(2);
      if (!cardDigits.includes(q) && !amountText.includes(q)) return false;
    }

    return true;
  });
}

function buildSummary(transactions: ReadonlyArray<Transaction>): TransactionSummary {
  const totalCount = transactions.length;
  const accepted = transactions.filter((tx) => tx.status === 'ACCEPTED');
  const rejected = transactions.filter((tx) => tx.status === 'REJECTED');
  const totalVolumeMinor = accepted.reduce((sum, tx) => sum + tx.amountMinor, 0);
  const averageVolumeMinor =
    accepted.length === 0 ? 0 : Math.round(totalVolumeMinor / accepted.length);

  const byDayMap = new Map<string, { count: number; volumeMinor: number }>();
  accepted.forEach((tx) => {
    const day = tx.occurredAt.slice(0, 10);
    const existing = byDayMap.get(day) ?? { count: 0, volumeMinor: 0 };
    existing.count += 1;
    existing.volumeMinor += tx.amountMinor;
    byDayMap.set(day, existing);
  });
  const byDay = Array.from(byDayMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, stats]) => ({ date, ...stats }));

  const byCardTypeMap = new Map<string, { count: number; volumeMinor: number }>();
  [...CARD_TYPES, 'REJECTED' as const].forEach((key) =>
    byCardTypeMap.set(key, { count: 0, volumeMinor: 0 }),
  );
  transactions.forEach((tx) => {
    const key = tx.status === 'REJECTED' ? 'REJECTED' : tx.cardType ?? 'REJECTED';
    const existing = byCardTypeMap.get(key) ?? { count: 0, volumeMinor: 0 };
    existing.count += 1;
    existing.volumeMinor += tx.amountMinor;
    byCardTypeMap.set(key, existing);
  });
  const byCardType = Array.from(byCardTypeMap.entries()).map(([cardType, stats]) => ({
    cardType: cardType as TransactionSummary['byCardType'][number]['cardType'],
    ...stats,
  }));

  return {
    totalCount,
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    totalVolumeMinor,
    averageVolumeMinor,
    currency: 'USD',
    byDay,
    byCardType,
  };
}

function createFromInput(input: CreateTransactionInput): Transaction {
  const cardNumber = input.cardNumber;
  const cardType = classifyCardType(cardNumber);
  const amountMinor = majorToMinor(Number(input.amountMajor));
  const occurredAt =
    input.occurredAt && input.occurredAt.trim().length > 0
      ? new Date(input.occurredAt).toISOString()
      : new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    cardholderName: input.cardholderName?.trim() ? input.cardholderName.trim() : null,
    cardNumber,
    cardType,
    amountMinor,
    currency: 'USD',
    occurredAt,
    status: cardType === null ? 'REJECTED' : 'ACCEPTED',
    rejectionReason: cardType === null ? 'Unsupported card network (leading digit).' : null,
    source: 'MANUAL',
  };
}

/**
 * Public service. Mirrors the eventual server surface 1:1 so swapping the
 * mock store for `apiRequest(...)` calls is a local change only.
 *
 * Future wiring:
 *   list:    apiRequest({ method:'GET',  path:'/transactions', query, schema: TransactionListResponseSchema })
 *   summary: apiRequest({ method:'GET',  path:'/transactions/summary', schema: TransactionSummarySchema })
 *   create:  apiRequest({ method:'POST', path:'/transactions', body, schema: TransactionSchema })
 *   upload:  apiRequest({ method:'POST', path:'/transactions/uploads', body: FormData, schema: UploadResultSchema })
 */
export const transactionsService = {
  async list(
    filters: TransactionFilters,
    signal?: AbortSignal,
  ): Promise<TransactionListResponse> {
    await sleep(SIMULATED_LATENCY_MS, signal);

    const filtered = applyFilters(mockStore.snapshot(), filters);
    const total = filtered.length;
    const page = Math.max(1, filters.page);
    const pageSize = Math.max(1, filters.pageSize);
    const start = (page - 1) * pageSize;
    const items = filtered
      .slice()
      .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
      .slice(start, start + pageSize);

    return TransactionListResponseSchema.parse({ items, total, page, pageSize });
  },

  async summary(signal?: AbortSignal): Promise<TransactionSummary> {
    await sleep(SIMULATED_LATENCY_MS, signal);
    const summary = buildSummary(mockStore.snapshot());
    return TransactionSummarySchema.parse(summary);
  },

  async create(input: CreateTransactionInput): Promise<Transaction> {
    await sleep(SIMULATED_LATENCY_MS);
    const created = createFromInput(input);
    mockStore.addOne(created);
    return TransactionSchema.parse(created);
  },

  async createMany(inputs: ReadonlyArray<CreateTransactionInput>): Promise<CreateManyResult> {
    await sleep(SIMULATED_LATENCY_MS);
    const created = inputs.map(createFromInput);
    if (created.length > 0) mockStore.addMany(created);
    const accepted = created.filter((tx) => tx.status === 'ACCEPTED').length;
    const rejected = created.length - accepted;
    return CreateManyResultSchema.parse({ accepted, rejected, created });
  },

  async uploadFiles(files: ReadonlyArray<File>): Promise<UploadResult> {
    await sleep(SIMULATED_LATENCY_MS);
    const all = await Promise.all(files.map(parseUploadFile));

    const accepted: Transaction[] = [];
    const rejected: Transaction[] = [];
    const errorEntries: UploadResult['errors'] = [];

    all.forEach((outcome, idx) => {
      accepted.push(...outcome.accepted);
      rejected.push(...outcome.rejected);
      outcome.errors.forEach((message) => {
        errorEntries.push({ file: files[idx]?.name ?? 'unknown', message });
      });
    });

    if (accepted.length + rejected.length > 0) {
      mockStore.addMany([...accepted, ...rejected]);
    }

    return UploadResultSchema.parse({
      accepted: accepted.length,
      rejected: rejected.length,
      errors: errorEntries,
    });
  },
};
