import {
  InsightsRow,
  SummaryCards,
  TransactionsTableCard,
  UploadPanel,
} from '@/features/transactions';

import styles from './DashboardPage.module.css';

export function DashboardPage() {
  return (
    <section className={styles.root} aria-labelledby="dashboard-title">
      <header className={styles.header}>
        <div>
          <h1 id="dashboard-title" className={styles.title}>
            Transactions dashboard
          </h1>
          <p className={styles.subtitle}>
            Monitor processor activity, ingest new transactions, and drill into recent history.
          </p>
        </div>
      </header>

      <div className={styles.row}>
        <SummaryCards />
      </div>

      <div className={styles.row}>
        <InsightsRow />
      </div>

      <div className={styles.row}>
        <UploadPanel />
      </div>

      <div className={styles.row}>
        <TransactionsTableCard />
      </div>
    </section>
  );
}
