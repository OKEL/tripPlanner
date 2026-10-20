/** Device-local date as YYYY-MM-DD. */
export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "2026-10-14" → "Oct 14" (in the given locale). Returns null for anything that isn't an ISO date. */
export function shortDate(iso: string | null, locale = 'en-US'): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

/** "8 days · Oct 11 – Oct 18" (the range only when the days have dates). */
export function tripSummary(
  days: { date: string | null }[],
  locale: string,
  daysLabel: (n: number) => string,
): string {
  const count = daysLabel(days.length);
  const dates = days.map((d) => shortDate(d.date, locale)).filter((d): d is string => d !== null);
  if (dates.length === 0) return count;
  return dates.length === 1 || dates[0] === dates[dates.length - 1]
    ? `${count} · ${dates[0]}`
    : `${count} · ${dates[0]} – ${dates[dates.length - 1]}`;
}

/** Timestamp from the server → "Oct 14". */
export function updatedLabel(timestamp: string, locale: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}
