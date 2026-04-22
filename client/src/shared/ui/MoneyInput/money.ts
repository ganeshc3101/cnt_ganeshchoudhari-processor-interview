/**
 * USD money-input helpers. The component stores a *raw* value (digits and at
 * most one `.` with up to 2 decimals) and renders a comma-formatted display
 * so the UX matches real currency fields without breaking the existing
 * `/^\d+(\.\d{1,2})?$/` validation shape.
 */

/** Strip anything not digit or dot; enforce one dot; cap decimals to 2. */
export function sanitizeMoneyInput(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.replace(/[^\d.]/g, '');

  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    const intPart = cleaned.slice(0, firstDot);
    const decPart = cleaned.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
    cleaned = `${intPart}.${decPart}`;
  }

  // Strip leading zeros but keep "0" and "0.x".
  if (cleaned.length > 1 && cleaned.startsWith('0') && !cleaned.startsWith('0.')) {
    cleaned = cleaned.replace(/^0+/, '') || '0';
  }

  return cleaned;
}

/** Format raw ("1234.5") → "1,234.5" while preserving in-progress decimals. */
export function formatMoneyDisplay(raw: string): string {
  if (!raw) return '';
  const [intPartRaw = '', decPart] = raw.split('.');
  const intPart = intPartRaw === '' ? '' : Number(intPartRaw).toLocaleString('en-US');
  if (raw.includes('.')) {
    return `${intPart || '0'}.${decPart ?? ''}`;
  }
  return intPart;
}

/**
 * Returns the caret index inside the *formatted* string that maps to the
 * caret index inside the *raw* string. Used to keep the caret near where the
 * user is typing even as commas get inserted/removed on each keystroke.
 */
export function mapRawCaretToDisplay(raw: string, display: string, rawCaret: number): number {
  // Count digits (and dot) up to rawCaret, then walk the display string
  // until we have matched that many non-separator characters.
  const target = raw.slice(0, rawCaret);
  let matched = 0;
  for (let i = 0; i < display.length; i += 1) {
    if (matched === target.length) return i;
    const ch = display[i];
    if (ch !== ',') matched += 1;
  }
  return display.length;
}

/**
 * Inverse of `mapRawCaretToDisplay`: from a caret in the displayed string,
 * compute the caret in the raw string (i.e. ignoring commas).
 */
export function mapDisplayCaretToRaw(display: string, displayCaret: number): number {
  let raw = 0;
  for (let i = 0; i < displayCaret && i < display.length; i += 1) {
    if (display[i] !== ',') raw += 1;
  }
  return raw;
}
