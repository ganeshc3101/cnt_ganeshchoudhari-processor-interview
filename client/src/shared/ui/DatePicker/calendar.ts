/**
 * Calendar helpers for the DatePicker. All dates are represented as
 * `YYYY-MM-DD` strings in the local timezone — the same format used by
 * `<input type="date">` so the filter layer stays untouched.
 */

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const MONTH_LABELS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function monthLabel(monthIndex: number): string {
  return MONTH_LABELS[monthIndex] ?? '';
}

export function monthLabelShort(monthIndex: number): string {
  return MONTH_LABELS_SHORT[monthIndex] ?? '';
}

/** Number of years shown at once in the year grid. */
export const YEARS_PER_PAGE = 12;

/**
 * Returns the inclusive [start, end] bounds of the page that contains `year`.
 * Pages are aligned to 12-year blocks, and always include the year itself.
 */
export function yearPageRange(year: number): { start: number; end: number } {
  const start = year - (year % YEARS_PER_PAGE);
  return { start, end: start + YEARS_PER_PAGE - 1 };
}

export function isYearOutOfRange(year: number, min: Date | null, max: Date | null): boolean {
  if (min && year < min.getFullYear()) return true;
  if (max && year > max.getFullYear()) return true;
  return false;
}

export function isMonthOutOfRange(
  year: number,
  monthIndex: number,
  min: Date | null,
  max: Date | null,
): boolean {
  const lastOfMonth = new Date(year, monthIndex + 1, 0);
  const firstOfMonth = new Date(year, monthIndex, 1);
  if (min && lastOfMonth < min) return true;
  if (max && firstOfMonth > max) return true;
  return false;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toYmd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseYmd(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

export function isAfter(a: Date, b: Date): boolean {
  return a.getTime() > b.getTime();
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  return next;
}

export type MonthCell = {
  date: Date;
  iso: string;
  inCurrentMonth: boolean;
};

/**
 * Returns a fixed 6-row × 7-col grid starting from the Sunday that covers the
 * first-of-month. Stable height regardless of month.
 */
export function buildMonthMatrix(visibleMonth: Date): MonthCell[][] {
  const firstOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
  const rows: MonthCell[][] = [];

  for (let r = 0; r < 6; r += 1) {
    const row: MonthCell[] = [];
    for (let c = 0; c < 7; c += 1) {
      const date = addDays(gridStart, r * 7 + c);
      row.push({
        date,
        iso: toYmd(date),
        inCurrentMonth: date.getMonth() === visibleMonth.getMonth(),
      });
    }
    rows.push(row);
  }
  return rows;
}

export function clampToRange(date: Date, min: Date | null, max: Date | null): Date {
  if (min && isBefore(date, min)) return new Date(min);
  if (max && isAfter(date, max)) return new Date(max);
  return date;
}

export function formatDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}
