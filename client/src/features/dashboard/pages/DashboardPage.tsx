import { Can, PERMISSIONS } from '@/features/auth';
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

      <Can permission={PERMISSIONS.REPORTS_READ}>
        <div className={styles.row}>
          <SummaryCards />
        </div>
      </Can>

      <Can permission={PERMISSIONS.REPORTS_READ}>
        <div className={styles.row}>
          <InsightsRow />
        </div>
      </Can>

      <Can anyOf={[PERMISSIONS.BATCHES_WRITE, PERMISSIONS.TRANSACTIONS_WRITE]}>
        <div className={styles.row}>
          <UploadPanel />
        </div>
      </Can>

      <Can permission={PERMISSIONS.TRANSACTIONS_READ}>
        <div className={styles.row}>
          <TransactionsTableCard />
        </div>
      </Can>
    </section>
  );
}
