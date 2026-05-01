import { z } from 'zod';

import { apiRequest } from '@/shared/api/apiClient';
import { utcHalfOpenRangeForLastNCalendarDays } from '@/shared/lib/date';
import { majorToMinor } from '@/shared/lib/money';

import {
  CARD_TYPES,
  TransactionSummarySchema,
  type TransactionSummary,
} from '../types/transaction';

const REPORT_RANGE_DAYS = 7;

const DashboardMetricsDtoSchema = z.object({
  totalTransactionCount: z.coerce.number().int().nonnegative(),
  acceptedCount: z.coerce.number().int().nonnegative(),
  rejectedCount: z.coerce.number().int().nonnegative(),
  totalVolumeAccepted: z.coerce.number().nonnegative(),
  averageAmountAccepted: z.coerce.number().nonnegative(),
});

const DailyVolumePointDtoSchema = z.object({
  day: z.string(),
  transactionCount: z.coerce.number().int().nonnegative(),
  totalVolume: z.coerce.number().nonnegative(),
});

const DailyVolumeResponseSchema = z.array(DailyVolumePointDtoSchema);

const CardBrandStatsDtoSchema = z.object({
  cardBrand: z.string(),
  count: z.coerce.number().int().nonnegative(),
  totalVolume: z.coerce.number().nonnegative(),
});

const CardDistributionResponseSchema = z.array(CardBrandStatsDtoSchema);

type CardSlice = TransactionSummary['byCardType'][number]['cardType'];

function isCardBrandFromApi(raw: string): raw is Exclude<CardSlice, 'REJECTED'> {
  return (CARD_TYPES as readonly string[]).includes(raw);
}

function mapCardDistribution(
  rows: z.infer<typeof CardDistributionResponseSchema>,
  rejectedCount: number,
): TransactionSummary['byCardType'] {
  const order = [...CARD_TYPES, 'REJECTED'] as const;
  const byType = new Map<CardSlice, { count: number; volumeMinor: number }>();
  for (const cardType of order) {
    byType.set(
      cardType,
      cardType === 'REJECTED'
        ? { count: rejectedCount, volumeMinor: 0 }
        : { count: 0, volumeMinor: 0 },
    );
  }

  for (const row of rows) {
    const key = row.cardBrand.toUpperCase();
    if (!isCardBrandFromApi(key)) continue;
    const cur = byType.get(key)!;
    cur.count = row.count;
    cur.volumeMinor = majorToMinor(row.totalVolume);
  }

  return order.map((cardType) => ({
    cardType,
    ...byType.get(cardType)!,
  }));
}

function mergeDailyVolume(
  apiPoints: z.infer<typeof DailyVolumeResponseSchema>,
  dayKeys: readonly string[],
): TransactionSummary['byDay'] {
  const byDay = new Map(apiPoints.map((p) => [p.day, p]));
  return dayKeys.map((date) => {
    const row = byDay.get(date);
    return {
      date,
      count: row?.transactionCount ?? 0,
      volumeMinor: row ? majorToMinor(row.totalVolume) : 0,
    };
  });
}

export async function fetchDashboardSummary(signal?: AbortSignal): Promise<TransactionSummary> {
  const { from, to, dayKeys } = utcHalfOpenRangeForLastNCalendarDays(REPORT_RANGE_DAYS);
  const query = { from, to };

  const [metrics, dailyVolume, cardDistribution] = await Promise.all([
    apiRequest({
      method: 'GET',
      path: '/v1/reports/metrics',
      query,
      schema: DashboardMetricsDtoSchema,
      ...(signal !== undefined ? { signal } : {}),
    }),
    apiRequest({
      method: 'GET',
      path: '/v1/reports/daily-volume',
      query,
      schema: DailyVolumeResponseSchema,
      ...(signal !== undefined ? { signal } : {}),
    }),
    apiRequest({
      method: 'GET',
      path: '/v1/reports/card-distribution',
      query,
      schema: CardDistributionResponseSchema,
      ...(signal !== undefined ? { signal } : {}),
    }),
  ]);

  const summary: TransactionSummary = {
    totalCount: metrics.totalTransactionCount,
    acceptedCount: metrics.acceptedCount,
    rejectedCount: metrics.rejectedCount,
    totalVolumeMinor: majorToMinor(metrics.totalVolumeAccepted),
    averageVolumeMinor: majorToMinor(metrics.averageAmountAccepted),
    currency: 'USD',
    byDay: mergeDailyVolume(dailyVolume, dayKeys),
    byCardType: mapCardDistribution(cardDistribution, metrics.rejectedCount),
  };

  return TransactionSummarySchema.parse(summary);
}
