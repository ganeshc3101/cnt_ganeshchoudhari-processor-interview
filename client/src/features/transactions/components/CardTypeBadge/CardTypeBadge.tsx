import { CardBrandIcon } from '@/shared/ui/CardBrandIcon';

import styles from './CardTypeBadge.module.css';

import type { CardType } from '../../types/transaction';


type Props = {
  cardType: CardType | null;
  compact?: boolean;
};

const LABELS: Record<CardType, string> = {
  AMEX: 'American Express',
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  DISCOVER: 'Discover',
};

export function CardTypeBadge({ cardType, compact = false }: Props) {
  if (cardType === null) {
    return (
      <span className={styles.root}>
        <CardBrandIcon brand="REJECTED" size={compact ? 'sm' : 'md'} />
        {compact ? null : <span className={styles.label}>Rejected</span>}
      </span>
    );
  }
  return (
    <span className={styles.root}>
      <CardBrandIcon brand={cardType} size={compact ? 'sm' : 'md'} />
      {compact ? null : <span className={styles.label}>{LABELS[cardType]}</span>}
    </span>
  );
}
