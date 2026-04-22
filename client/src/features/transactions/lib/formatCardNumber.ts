/**
 * Format a raw card number into 4-digit groups (e.g. `4242424242424242` →
 * `4242 4242 4242 4242`). Non-digit characters are stripped.
 */
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D+/g, '');
  if (digits.length === 0) return '';
  return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
}

/**
 * Mask all but the last 4 digits: `•••• •••• •••• 4242`.
 * Never log PII — use this for display-only contexts where masking is required.
 */
export function maskCardNumber(raw: string): string {
  const digits = raw.replace(/\D+/g, '');
  if (digits.length <= 4) return formatCardNumber(digits);
  const last4 = digits.slice(-4);
  const hidden = digits.slice(0, -4).replace(/\d/g, '•');
  return formatCardNumber(hidden + last4);
}
