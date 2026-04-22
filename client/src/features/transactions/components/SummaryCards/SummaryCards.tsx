
import { formatCompactMoney, formatMoney } from '@/shared/lib/money';
import { Card } from '@/shared/ui/Card';
import { ErrorState } from '@/shared/ui/ErrorState';
import { AlertIcon, CreditCardIcon } from '@/shared/ui/icons';
import { Skeleton } from '@/shared/ui/Skeleton';

import styles from './SummaryCards.module.css';
import { useTransactionSummary } from '../../hooks/useTransactionSummary';

import type { ReactNode } from 'react';

type Tile = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone: 'brand' | 'success' | 'warning' | 'danger';
};

function SummaryTile({ tile }: { tile: Tile }) {
  return (
    <Card padding="md" className={styles.tile}>
      <div className={styles.tileHead}>
        <span className={styles[`tone_${tile.tone}`]} aria-hidden="true">
          {tile.icon}
        </span>
        <span className={styles.label}>{tile.label}</span>
      </div>
      <p className={styles.value}>{tile.value}</p>
      {tile.hint ? <p className={styles.hint}>{tile.hint}</p> : null}
    </Card>
  );
}

function LoadingTile() {
  return (
    <Card padding="md" className={styles.tile}>
      <Skeleton width={120} height={12} />
      <Skeleton width={140} height={28} />
      <Skeleton width={80} height={12} />
    </Card>
  );
}

export function SummaryCards() {
  const { data, isLoading, isError, refetch } = useTransactionSummary();

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  if (isLoading || !data) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingTile key={i} />
        ))}
      </div>
    );
  }

  const tiles: Tile[] = [
    {
      id: 'count',
      label: 'Total transactions',
      value: data.totalCount.toLocaleString(),
      hint: `${data.acceptedCount.toLocaleString()} accepted`,
      icon: <CreditCardIcon />,
      tone: 'brand',
    },
    {
      id: 'volume',
      label: 'Total volume',
      value: formatMoney(data.totalVolumeMinor, data.currency),
      hint: `~${formatCompactMoney(data.totalVolumeMinor, data.currency)}`,
      icon: <CreditCardIcon />,
      tone: 'success',
    },
    {
      id: 'avg',
      label: 'Average transaction',
      value: formatMoney(data.averageVolumeMinor, data.currency),
      hint: 'Accepted only',
      icon: <CreditCardIcon />,
      tone: 'warning',
    },
    {
      id: 'rejected',
      label: 'Rejected transactions',
      value: data.rejectedCount.toLocaleString(),
      hint:
        data.totalCount === 0
          ? 'No data yet'
          : `${Math.round((data.rejectedCount / data.totalCount) * 100)}% of total`,
      icon: <AlertIcon />,
      tone: 'danger',
    },
  ];

  return (
    <div className={styles.grid}>
      {tiles.map((tile) => (
        <SummaryTile key={tile.id} tile={tile} />
      ))}
    </div>
  );
}
