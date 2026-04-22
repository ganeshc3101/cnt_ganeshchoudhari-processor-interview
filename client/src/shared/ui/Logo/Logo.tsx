import styles from './Logo.module.css';

type Props = {
  className?: string;
  hideWordmark?: boolean;
};

export function Logo({ className, hideWordmark = false }: Props) {
  const rootClasses = [styles.root, className].filter(Boolean).join(' ');

  return (
    <span className={rootClasses} aria-label="Card Processor">
      <span className={styles.mark} aria-hidden="true">
        <svg viewBox="0 0 32 32" width="28" height="28" fill="none" focusable="false">
          <rect className={styles.markBg} x="1" y="1" width="30" height="30" rx="8" />
          <path
            className={styles.markStroke}
            d="M9 13h10M9 19h6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle className={styles.markAccent} cx="22" cy="19" r="2.5" />
        </svg>
      </span>
      {hideWordmark ? null : <span className={styles.wordmark}>Card Processor</span>}
    </span>
  );
}
