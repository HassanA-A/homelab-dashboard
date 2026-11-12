import { addDays, daysBetween, type ISODate } from "@/lib/dates";

export interface WeighIn {
  local_date: ISODate;
  weight_kg: number;
}

export interface DailyWeight {
  date: ISODate;
  /** mean of that day's weigh-ins, null if none */
  scale: number | null;
  /** exponentially smoothed trend weight */
  trend: number;
  /** simple trailing 7-day mean of available weigh-ins */
  avg7: number | null;
}

/** Average multiple weigh-ins per day. Returns ascending by date. */
export function dailyMeans(entries: WeighIn[]): { date: ISODate; weight: number }[] {
  const byDay = new Map<ISODate, number[]>();
  for (const e of entries) {
    const list = byDay.get(e.local_date) ?? [];
    list.push(Number(e.weight_kg));
    byDay.set(e.local_date, list);
  }
  return [...byDay.entries()]
    .map(([date, ws]) => ({ date, weight: ws.reduce((a, b) => a + b, 0) / ws.length }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Build a continuous daily series with a smoothed trend line.
 * Trend uses an EWMA (alpha 0.1/day); on missing days the trend simply carries forward,
 * so gaps don't distort it. A single weigh-in moves the trend by only ~10% of its deviation,
 * which is the point: one salty dinner is not fat gain.
 */
export function weightSeries(entries: WeighIn[], alpha = 0.1): DailyWeight[] {
  const days = dailyMeans(entries);
  if (days.length === 0) return [];
  const first = days[0]!;
  const last = days[days.length - 1]!;
  const lookup = new Map(days.map((d) => [d.date, d.weight]));
  const out: DailyWeight[] = [];
  let trend = first.weight;
  const n = daysBetween(first.date, last.date);
  for (let i = 0; i <= n; i++) {
    const date = addDays(first.date, i);
    const scale = lookup.get(date) ?? null;
    if (scale != null) trend = trend + alpha * (scale - trend);
    const window: number[] = [];
    for (let j = 0; j < 7; j++) {
      const v = lookup.get(addDays(date, -j));
      if (v != null) window.push(v);
    }
    out.push({ date, scale, trend, avg7: window.length ? window.reduce((a, b) => a + b, 0) / window.length : null });
  }
  return out;
}

/** Least-squares slope in kg/day over (x = day index, y). */
export function slopePerDay(points: { x: number; y: number }[]): number | null {
  if (points.length < 2) return null;
  const n = points.length;
  const mx = points.reduce((a, p) => a + p.x, 0) / n;
  const my = points.reduce((a, p) => a + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  return den === 0 ? null : num / den;
}
