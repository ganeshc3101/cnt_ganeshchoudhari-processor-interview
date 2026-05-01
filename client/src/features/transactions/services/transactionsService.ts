import { apiMultipartRequest, apiRequest } from '@/shared/api/apiClient';
import { HttpError, NetworkError } from '@/shared/api/ApiError';
import { localDateToNextDayStartIso, localDateToStartOfDayIso } from '@/shared/lib/date';
import { majorToMinor } from '@/shared/lib/money';

import { mockStore } from './mockStore';
import { classifyCardType } from '../lib/cardType';
import {
  BatchUploadResultDtoSchema,
  CARD_TYPES,
  CardTypeSchema,
  CreateManyResultSchema,
  TransactionListPageDtoSchema,
  TransactionListResponseSchema,
  TransactionSchema,
  TransactionCreateManyResponseSchema,
  UploadResultSchema,
  type CreateManyResult,
  type CreateTransactionInput,
  type Transaction,
  type TransactionFilters,
  type TransactionListResponse,
  type TransactionResponseDto,
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

/**
 * Builds a display-only digit string for masking (first4 / last4). Length is
 * clamped to 13–19 to satisfy {@link TransactionSchema}.
 */
function syntheticPanDigits(first4: string, last4: string): string {
  const f = first4.replace(/\D/g, '');
  const l = last4.replace(/\D/g, '');
  if (f.length + l.length >= 13) {
    if (f.length + l.length <= 19) return `${f}${l}`;
    return `${f.slice(0, 4)}${'0'.repeat(11)}${l.slice(-4)}`;
  }
  const pad = 13 - f.length - l.length;
  return `${f}${'0'.repeat(Math.max(0, pad))}${l}`;
}

function mapApiSource(raw: string): Transaction['source'] {
  switch (raw.toUpperCase()) {
    case 'BATCH':
      return 'UPLOAD';
    case 'MANUAL':
      return 'MANUAL';
    case 'SEED':
      return 'SEED';
    default:
      return 'MANUAL';
  }
}

function listRowFromDto(dto: TransactionResponseDto): Transaction {
  const currencyRaw = dto.currency.trim().toUpperCase();
  const currency = currencyRaw.length === 3 ? currencyRaw : 'USD';
  const nameRaw = dto.cardholderName;
  const cardholderName =
    nameRaw !== undefined && nameRaw !== null && nameRaw.trim() !== '' ? nameRaw.trim() : null;
  const row = {
    id: dto.id,
    cardholderName,
    cardNumber: syntheticPanDigits(dto.cardFirst4, dto.cardLast4),
    cardType: CardTypeSchema.parse(dto.cardBrand.toUpperCase()),
    amountMinor: majorToMinor(dto.amount),
    currency,
    occurredAt: new Date(dto.occurredAt).toISOString(),
    status: 'ACCEPTED' as const,
    rejectionReason: null,
    source: mapApiSource(dto.source),
  };
  return TransactionSchema.parse(row);
}

function batchUploadFormat(fileName: string): 'csv' | 'json' | null {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'json') return 'json';
  if (ext === 'csv') return 'csv';
  return null;
}

function uploadFailureMessage(cause: unknown): string {
  if (cause instanceof HttpError) {
    const b = cause.body;
    if (
      b &&
      typeof b === 'object' &&
      'message' in b &&
      typeof (b as { message: unknown }).message === 'string'
    ) {
      return (b as { message: string }).message;
    }
    return `Upload failed (HTTP ${cause.status}).`;
  }
  if (cause instanceof NetworkError) {
    return 'Network error. Check your connection and try again.';
  }
  return 'Upload failed.';
}

function buildListQuery(
  filters: TransactionFilters,
): Record<string, string | number | boolean | readonly string[] | undefined> {
  const brandsOnly = filters.cardTypes.filter((c) => c !== 'REJECTED');
  const query: Record<string, string | number | boolean | readonly string[] | undefined> = {
    page: filters.page - 1,
    size: filters.pageSize,
  };

  const fromDay = filters.from.trim();
  const toDay = filters.to.trim();
  if (fromDay !== '') query.from = localDateToStartOfDayIso(fromDay);
  if (toDay !== '') query.to = localDateToNextDayStartIso(toDay);

  const allSelected =
    brandsOnly.length === CARD_TYPES.length &&
    CARD_TYPES.every((b) => brandsOnly.includes(b));
  if (brandsOnly.length > 0 && !allSelected) {
    query.cardBrands = brandsOnly.map((b) => b.toUpperCase());
  }

  const minT = filters.minAmount.trim();
  const maxT = filters.maxAmount.trim();
  if (minT !== '') query.minAmount = minT;
  if (maxT !== '') query.maxAmount = maxT;

  return query;
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
 * Public service. List, batch file upload, and manual multi-create use the processor API;
 * single create remains mock-backed.
 *
 * Dashboard summary charts use `fetchDashboardSummary` in `reportsService.ts`.
 */
export const transactionsService = {
  async list(
    filters: TransactionFilters,
    signal?: AbortSignal,
  ): Promise<TransactionListResponse> {
    const brandsOnly = filters.cardTypes.filter((c) => c !== 'REJECTED');
    const onlyRejected = filters.cardTypes.length > 0 && brandsOnly.length === 0;
    if (onlyRejected) {
      return TransactionListResponseSchema.parse({
        items: [],
        total: 0,
        page: filters.page,
        pageSize: filters.pageSize,
      });
    }

    const pageDto = await apiRequest({
      method: 'GET',
      path: '/v1/transactions',
      query: buildListQuery(filters),
      schema: TransactionListPageDtoSchema,
      ...(signal !== undefined ? { signal } : {}),
    });

    return TransactionListResponseSchema.parse({
      items: pageDto.content.map(listRowFromDto),
      total: pageDto.totalElements,
      page: pageDto.page + 1,
      pageSize: pageDto.size,
    });
  },

  async create(input: CreateTransactionInput): Promise<Transaction> {
    await sleep(SIMULATED_LATENCY_MS);
    const created = createFromInput(input);
    mockStore.addOne(created);
    return TransactionSchema.parse(created);
  },

  async createMany(inputs: ReadonlyArray<CreateTransactionInput>): Promise<CreateManyResult> {
    if (inputs.length === 0) {
      return CreateManyResultSchema.parse({ accepted: 0, rejected: 0, created: [] });
    }

    const body = inputs.map((input) => {
      const row: Record<string, string | number> = {
        cardNumber: input.cardNumber.replace(/\D/g, ''),
        amount: Number(input.amountMajor),
        currency: 'USD',
      };
      const name = input.cardholderName?.trim();
      if (name !== undefined && name.length > 0) {
        row.cardholderName = name;
      }
      if (input.occurredAt !== undefined && input.occurredAt.trim() !== '') {
        row.timestamp = input.occurredAt;
      }
      return row;
    });

    const dtos = await apiRequest({
      method: 'POST',
      path: '/v1/transactions',
      body,
      schema: TransactionCreateManyResponseSchema,
    });

    const created = dtos.map((dto) => listRowFromDto(dto));
    return CreateManyResultSchema.parse({
      accepted: created.length,
      rejected: 0,
      created,
    });
  },

  async uploadFiles(files: ReadonlyArray<File>, signal?: AbortSignal): Promise<UploadResult> {
    let accepted = 0;
    let rejected = 0;
    const errors: UploadResult['errors'] = [];

    for (const file of files) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const format = batchUploadFormat(file.name);
      if (format === null) {
        errors.push({
          file: file.name,
          message: 'Only CSV and JSON files are supported for batch upload.',
        });
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);

      try {
        const batch = await apiMultipartRequest({
          path: '/v1/transactions/batch',
          formData,
          schema: BatchUploadResultDtoSchema,
          ...(signal !== undefined ? { signal } : {}),
        });
        accepted += batch.acceptedRows;
        rejected += batch.rejectedRows;
      } catch (e: unknown) {
        errors.push({ file: file.name, message: uploadFailureMessage(e) });
      }
    }

    return UploadResultSchema.parse({ accepted, rejected, errors });
  },
};
