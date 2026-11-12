// Calendar-date helpers. Dates are ISO "YYYY-MM-DD" strings in the user's local timezone —
// never derive them from UTC timestamps on the server.

export type ISODate = string;

export function todayIn(timeZone: string, now = new Date()): ISODate {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export function isISODate(s: string | undefined | null): s is ISODate {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

export function formatDayLabel(date: ISODate, today: ISODate): string {
  const diff = daysBetween(today, date);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}
