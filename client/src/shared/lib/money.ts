/**
 * Money helpers — amounts are carried as integer minor units once they leave
 * the network boundary (e.g. `1234` for USD 12.34). Never float.
 */

const FRACTION_DIGITS = 2;

export function minorToMajor(amountMinor: number): number {
  return amountMinor / 100;
}

export function majorToMinor(amountMajor: number): number {
  return Math.round(amountMajor * 100);
}

export function formatMoney(amountMinor: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: FRACTION_DIGITS,
    maximumFractionDigits: FRACTION_DIGITS,
  }).format(minorToMajor(amountMinor));
}

export function formatCompactMoney(
  amountMinor: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(minorToMajor(amountMinor));
}
