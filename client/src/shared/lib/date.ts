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
