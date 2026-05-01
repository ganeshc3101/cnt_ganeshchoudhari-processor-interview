const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
});

export function formatDate(isoOrDate: string | Date): string {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  return DATE_FORMATTER.format(d);
}

export function formatDateTime(isoOrDate: string | Date): string {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  return DATETIME_FORMATTER.format(d);
}

export function formatShortDate(isoOrDate: string | Date): string {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  return SHORT_DATE_FORMATTER.format(d);
}

/** "YYYY-MM-DD" for a given Date in local time — suitable for <input type="date"> values. */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Truncate an ISO/Date to the start of its calendar day (local). */
export function startOfDay(isoOrDate: string | Date): Date {
  const d = isoOrDate instanceof Date ? new Date(isoOrDate) : new Date(isoOrDate);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Half-open UTC instant range `[from, to)` for APIs that filter with
 * `occurredAt >= from AND occurredAt < to`, spanning `dayCount` UTC calendar days
 * that include the current UTC calendar day.
 */
export function utcHalfOpenRangeForLastNCalendarDays(dayCount: number): {
  from: string;
  to: string;
  /** `YYYY-MM-DD`, ascending, length === dayCount */
  dayKeys: readonly string[];
} {
  if (dayCount < 1) {
    throw new Error('dayCount must be at least 1');
  }
  const now = new Date();
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0),
  );
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - dayCount);

  const dayKeys: string[] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(to);
    d.setUTCDate(d.getUTCDate() - 1 - i);
    dayKeys.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`,
    );
  }

  return { from: from.toISOString(), to: to.toISOString(), dayKeys };
}

/**
 * Interpret `YYYY-MM-DD` as **local** midnight and return an ISO instant (matches
 * `<input type="date">` + legacy mock list filtering).
 */
export function localDateToStartOfDayIso(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toISOString();
}

/**
 * Exclusive end bound for a **local** calendar day: instant at local midnight of the next day.
 */
export function localDateToNextDayStartIso(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}
