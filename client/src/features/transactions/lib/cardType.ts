import type { CardType } from '../types/transaction';

/**
 * Classify a card number by its leading digit. Per spec:
 *   3 → AMEX · 4 → VISA · 5 → MASTERCARD · 6 → DISCOVER · else → rejected
 *
 * Returns `null` for any other leading digit, signalling the upstream layer
 * should reject the transaction.
 */
export function classifyCardType(cardNumber: string): CardType | null {
  const digits = cardNumber.replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(digits)) return null;

  const leading = digits.charAt(0);
  switch (leading) {
    case '3':
      return 'AMEX';
    case '4':
      return 'VISA';
    case '5':
      return 'MASTERCARD';
    case '6':
      return 'DISCOVER';
    default:
      return null;
  }
}
