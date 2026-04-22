import { Button } from '@/shared/ui/Button';
import { AlertIcon, RefreshIcon } from '@/shared/ui/icons';

import styles from './ErrorState.module.css';

type Props = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn’t load this data. Please try again.',
  onRetry,
  retryLabel = 'Retry',
}: Props) {
  return (
    <div className={styles.root} role="alert">
      <div className={styles.icon} aria-hidden="true">
        <AlertIcon />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" leadingIcon={<RefreshIcon />} onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
