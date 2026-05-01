import { formatDateTime } from '@/shared/lib/date';
import { formatMoney } from '@/shared/lib/money';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { InboxIcon } from '@/shared/ui/icons';
import { Pagination } from '@/shared/ui/Pagination';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Table, type TableColumn } from '@/shared/ui/Table';

import { TransactionFiltersBar } from './TransactionFilters';
import styles from './TransactionsTableCard.module.css';
import { useTransactionFilters } from '../../hooks/useTransactionFilters';
import { useTransactions } from '../../hooks/useTransactions';
import { maskCardNumber } from '../../lib/formatCardNumber';
import { CardTypeBadge } from '../CardTypeBadge';

import type { Transaction } from '../../types/transaction';


const COLUMNS: ReadonlyArray<TableColumn<Transaction>> = [
  {
    id: 'cardholder',
    header: 'Cardholder',
    render: (row) => (
      <span className={styles.cardholder}>
        {row.cardholderName ?? <span className={styles.muted}>Unknown</span>}
      </span>
    ),
  },
  {
    id: 'card',
    header: 'Card',
    render: (row) => (
      <div className={styles.cardCell}>
        <CardTypeBadge cardType={row.cardType} compact />
        <span className={styles.cardNumber}>{maskCardNumber(row.cardNumber)}</span>
      </div>
    ),
  },
  {
    id: 'amount',
    header: 'Amount',
    align: 'end',
    render: (row) => (
      <span className={styles.amount}>{formatMoney(row.amountMinor, row.currency)}</span>
    ),
  },
  {
    id: 'occurredAt',
    header: 'Occurred at',
    render: (row) => <span className={styles.when}>{formatDateTime(row.occurredAt)}</span>,
  },
  {
    id: 'status',
    header: 'Status',
    render: (row) =>
      row.status === 'ACCEPTED' ? (
        <Badge tone="success">Accepted</Badge>
      ) : (
        <span title={row.rejectionReason ?? undefined}>
          <Badge tone="danger">Rejected</Badge>
        </span>
      ),
  },
];

function LoadingTable() {
  return (
    <div className={styles.skeletonList}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} height={44} />
      ))}
    </div>
  );
}

export function TransactionsTableCard() {
  const { rawFilters, queryFilters, setFilters, setPage, resetFilters } = useTransactionFilters();
  const { data, isLoading, isFetching, isError, refetch } = useTransactions(queryFilters);

  const hasActiveFilters =
    rawFilters.cardTypes.length > 0 ||
    rawFilters.from !== '' ||
    rawFilters.to !== '' ||
    rawFilters.minAmount !== '' ||
    rawFilters.maxAmount !== '';

  const renderBody = () => {
    if (isError) {
      return <ErrorState onRetry={() => void refetch()} />;
    }
    if (isLoading || !data) {
      return <LoadingTable />;
    }
    if (data.total === 0) {
      return (
        <EmptyState
          icon={<InboxIcon />}
          title={hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
          description={
            hasActiveFilters
              ? 'Try clearing filters or adjusting the date / amount range.'
              : 'Upload a file or add a transaction manually to populate this list.'
          }
        />
      );
    }

    return (
      <>
        <Table<Transaction>
          columns={COLUMNS}
          rows={data.items}
          getRowId={(row) => row.id}
          caption={`Transactions ${isFetching ? '(updating…)' : ''}`}
        />
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={setPage}
        />
      </>
    );
  };

  return (
    <Card
      title="Transactions"
      subtitle="Filter by card type, date range, or amount. The list shows accepted transactions from the server (last 30 days when no dates are set)."
      className={styles.card}
    >
      <TransactionFiltersBar
        filters={rawFilters}
        onChange={setFilters}
        onReset={resetFilters}
      />
      <div className={styles.body}>{renderBody()}</div>
    </Card>
  );
}
