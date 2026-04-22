import clsx from 'clsx';

import styles from './CardBrandIcon.module.css';
import amexLogo from './logos/amex.svg';
import discoverLogo from './logos/discover.svg';
import mastercardLogo from './logos/mastercard.svg';
import visaLogo from './logos/visa.svg';

export type CardBrand = 'AMEX' | 'VISA' | 'MASTERCARD' | 'DISCOVER' | 'REJECTED';

type Props = {
  brand: CardBrand;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const BRAND_LOGOS: Record<Exclude<CardBrand, 'REJECTED'>, { src: string; label: string }> = {
  AMEX: { src: amexLogo, label: 'American Express' },
  VISA: { src: visaLogo, label: 'Visa' },
  MASTERCARD: { src: mastercardLogo, label: 'Mastercard' },
  DISCOVER: { src: discoverLogo, label: 'Discover' },
};

export function CardBrandIcon({ brand, size = 'md', className }: Props) {
  if (brand === 'REJECTED') {
    return (
      <span
        className={clsx(styles.root, styles[`size_${size}`], styles.rejected, className)}
        aria-label="Rejected card"
        role="img"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.rejectedIcon}>
          <path
            d="M5 12h14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  const logo = BRAND_LOGOS[brand];

  return (
    <span
      className={clsx(styles.root, styles[`size_${size}`], className)}
      role="img"
      aria-label={`${logo.label} card`}
    >
      <img src={logo.src} alt="" className={styles.image} draggable={false} />
    </span>
  );
}
