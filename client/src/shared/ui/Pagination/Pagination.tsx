import { Button } from '@/shared/ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/ui/icons';

import styles from './Pagination.module.css';

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (next: number) => void;
};

export function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <nav className={styles.root} aria-label="Pagination">
      <p className={styles.status} aria-live="polite">
        {total === 0
          ? 'No results'
          : `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}`}
      </p>
      <div className={styles.controls}>
        <Button
          variant="secondary"
          size="sm"
          disabled={!canPrev}
          leadingIcon={<ChevronLeftIcon />}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Prev
        </Button>
        <span className={styles.page}>
          Page <strong>{page}</strong> of {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={!canNext}
          leadingIcon={<ChevronRightIcon />}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
