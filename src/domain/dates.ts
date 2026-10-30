// All day/week math uses the device's local time, never UTC.

const pad = (n: number) => String(n).padStart(2, '0');

export function localDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local midnight of the Monday that starts the week containing ts. */
export function startOfLocalWeek(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const daysSinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  return d.getTime();
}

export function isSameLocalWeek(a: number, b: number): boolean {
  return startOfLocalWeek(a) === startOfLocalWeek(b);
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function formatDurationShort(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60 ? `${s % 60}s` : ''}`.trim();
  return `${s}s`;
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export const WEEKDAYS_MON_FIRST: { day: number; short: string }[] = [
  { day: 1, short: 'LUN' },
  { day: 2, short: 'MAR' },
  { day: 3, short: 'MIÉ' },
  { day: 4, short: 'JUE' },
  { day: 5, short: 'VIE' },
  { day: 6, short: 'SÁB' },
  { day: 0, short: 'DOM' },
];

export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
