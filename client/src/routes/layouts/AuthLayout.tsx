import { Outlet } from 'react-router-dom';

import { Logo } from '@/shared/ui/Logo';

import styles from './AuthLayout.module.css';

export function AuthLayout() {
  return (
    <div className={styles.root}>
      <section className={styles.formCol}>
        <header className={styles.header}>
          <Logo />
        </header>
        <div className={styles.formInner}>
          <Outlet />
        </div>
      </section>

      <aside className={styles.brandCol} aria-hidden="true">
        <div className={styles.brandInner}>
          <span className={styles.brandEyebrow}>Merchant Console</span>
          <h2 className={styles.brandTitle}>More than payments.</h2>
          <p className={styles.brandCopy}>
            Process transactions, review reports, and manage your merchant account — all in one
            place.
          </p>
          <ul className={styles.brandList}>
            <li className={styles.brandListItem}>
              <span className={styles.brandBullet} /> Real-time transaction monitoring
            </li>
            <li className={styles.brandListItem}>
              <span className={styles.brandBullet} /> Dual-pricing &amp; surcharge support
            </li>
            <li className={styles.brandListItem}>
              <span className={styles.brandBullet} /> Fraud alerts &amp; dispute tools
            </li>
          </ul>
        </div>
        <div className={styles.brandGlow} aria-hidden="true" />
      </aside>
    </div>
  );
}
