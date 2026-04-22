import styles from './PageSkeleton.module.css';

export function PageSkeleton() {
  return (
    <div className={styles.root} role="status" aria-live="polite" aria-label="Loading">
      <span className={styles.bar} />
      <span className={styles.bar} />
      <span className={styles.bar} />
    </div>
  );
}
