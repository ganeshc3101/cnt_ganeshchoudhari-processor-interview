import { useMemo, useState } from 'react';

import { formatShortDate } from '@/shared/lib/date';
import { formatCompactMoney, formatMoney } from '@/shared/lib/money';
import { Card } from '@/shared/ui/Card';
import { DonutChart, type DonutSlice } from '@/shared/ui/DonutChart';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { CreditCardIcon, DollarIcon, HashIcon, InboxIcon } from '@/shared/ui/icons';
import { LineChart, type LinePoint } from '@/shared/ui/LineChart';
import { SegmentedControl, type SegmentItem } from '@/shared/ui/SegmentedControl';
import { Skeleton } from '@/shared/ui/Skeleton';

import { useTransactionSummary } from '../../hooks/useTransactionSummary';
import { CardTypeBadge } from '../CardTypeBadge';
import styles from './InsightsRow.module.css';

import type { CardType } from '../../types/transaction';


const BRAND_COLOR: Record<string, string> = {
  AMEX: 'var(--color-brand-amex)',
  VISA: 'var(--color-brand-visa)',
  MASTERCARD: 'var(--color-brand-mastercard)',
  DISCOVER: 'var(--color-brand-discover)',
  REJECTED: 'var(--color-brand-rejected)',
};

type DonutMetric = 'count' | 'volume';

const DONUT_SEGMENTS: ReadonlyArray<SegmentItem<DonutMetric>> = [
  { id: 'count', label: 'Count', icon: <HashIcon width={14} height={14} /> },
  { id: 'volume', label: 'Volume', icon: <DollarIcon width={14} height={14} /> },
];

function LoadingChart({ height }: { height: number }) {
  return (
    <div className={styles.loader}>
      <Skeleton height={height} radius="md" />
    </div>
  );
}

export function InsightsRow() {
  const { data, isLoading, isError, refetch } = useTransactionSummary();
  const [donutMetric, setDonutMetric] = useState<DonutMetric>('count');

  const linePoints = useMemo<LinePoint[]>(() => {
    if (!data) return [];
    return data.byDay.map((day) => ({
      label: formatShortDate(day.date),
      value: day.volumeMinor,
    }));
  }, [data]);

  const donutSlices = useMemo<DonutSlice[]>(() => {
    if (!data) return [];
    return data.byCardType
      .filter((entry) => (donutMetric === 'count' ? entry.count : entry.volumeMinor) > 0)
      .map((entry) => ({
        id: entry.cardType,
        label:
          entry.cardType === 'REJECTED'
            ? 'Rejected'
            : entry.cardType.charAt(0) + entry.cardType.slice(1).toLowerCase(),
        value: donutMetric === 'count' ? entry.count : entry.volumeMinor,
        color: BRAND_COLOR[entry.cardType] ?? 'var(--color-neutral-500)',
      }));
  }, [data, donutMetric]);

  const { centerLabel, centerValue, donutFormatter, legendFormatter } = useMemo(() => {
    if (!data) {
      return {
        centerLabel: '',
        centerValue: '',
        donutFormatter: (v: number) => v.toLocaleString(),
        legendFormatter: (v: number) => v.toLocaleString(),
      };
    }
    if (donutMetric === 'count') {
      return {
        centerLabel: 'cards',
        centerValue: data.totalCount.toLocaleString(),
        donutFormatter: (v: number) => v.toLocaleString(),
        legendFormatter: (v: number) => v.toLocaleString(),
      };
    }
    return {
      centerLabel: 'total volume',
      centerValue: formatCompactMoney(data.totalVolumeMinor, data.currency),
      donutFormatter: (v: number) => formatMoney(Math.round(v), data.currency),
      legendFormatter: (v: number) => formatMoney(Math.round(v), data.currency),
    };
  }, [data, donutMetric]);

  const renderLineBody = () => {
    if (isError) return <ErrorState onRetry={() => void refetch()} />;
    if (isLoading || !data) return <LoadingChart height={220} />;
    if (linePoints.length === 0) {
      return (
        <EmptyState
          icon={<InboxIcon />}
          title="No transactions yet"
          description="Volume will appear here after uploads or manual entries are processed."
        />
      );
    }
    return (
      <LineChart
        data={linePoints}
        ariaLabel="Transaction volume by day"
        valueFormatter={(v) => formatCompactMoney(Math.round(v))}
      />
    );
  };

  const renderDonutBody = () => {
    if (isError) return <ErrorState onRetry={() => void refetch()} />;
    if (isLoading || !data) return <LoadingChart height={180} />;
    if (donutSlices.length === 0) {
      return (
        <EmptyState
          icon={<CreditCardIcon />}
          title="No cards yet"
          description="Upload or add a transaction to see card type distribution."
        />
      );
    }
    return (
      <div className={styles.donutLayout}>
        <DonutChart
          slices={donutSlices}
          centerLabel={centerLabel}
          centerValue={centerValue}
          valueFormatter={donutFormatter}
          ariaLabel={
            donutMetric === 'count'
              ? 'Card type distribution by transaction count'
              : 'Card type distribution by total volume'
          }
        />
        <ul className={styles.legend}>
          {donutSlices.map((slice) => {
            const cardType: CardType | null =
              slice.id === 'REJECTED' ? null : (slice.id as CardType);
            return (
              <li key={slice.id} className={styles.legendItem}>
                <span
                  className={styles.legendSwatch}
                  style={{ background: slice.color }}
                  aria-hidden="true"
                />
                <CardTypeBadge cardType={cardType} compact />
                <span className={styles.legendLabel}>{slice.label}</span>
                <span className={styles.legendValue}>{legendFormatter(slice.value)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className={styles.row}>
      <Card
        title="Transactions over time"
        subtitle="Daily accepted volume"
        className={styles.line}
      >
        {renderLineBody()}
      </Card>
      <Card
        title="Card type distribution"
        subtitle={
          donutMetric === 'count'
            ? 'Number of transactions per card brand'
            : 'Total volume per card brand'
        }
        className={styles.donut}
        actions={
          <SegmentedControl<DonutMetric>
            ariaLabel="Donut chart metric"
            size="sm"
            items={DONUT_SEGMENTS}
            value={donutMetric}
            onChange={setDonutMetric}
          />
        }
      >
        {renderDonutBody()}
      </Card>
    </div>
  );
}
