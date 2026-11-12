import "server-only";
import { addDays } from "@/lib/dates";
import { computeAdaptive, type GoalType } from "@/lib/analytics/adaptive";
import { weightSeries } from "@/lib/analytics/weight";
import { fromKg } from "@/lib/units";
import { getDailyTotals } from "@/lib/nutrition/queries";
import { getWeights } from "./queries";

/** Everything the Body page and dashboard need about weight, computed once. */
export async function getBodySummary(today: string, unit: "lb" | "kg", goalType: GoalType, currentTarget: number, days = 90) {
  const from = addDays(today, -(days + 14));
  const [weights, intake] = await Promise.all([getWeights(from), getDailyTotals(addDays(today, -35), today)]);
  const series = weightSeries(weights);
  const chart = series
    .filter((d) => d.date >= addDays(today, -days))
    .map((d) => ({ date: d.date, scale: d.scale == null ? null : +fromKg(d.scale, unit).toFixed(1), trend: +fromKg(d.trend, unit).toFixed(2) }));

  const last = series.at(-1);
  const weekAgo = series.find((d) => d.date === addDays(last?.date ?? today, -7));
  const latest = weights[0];

  const adaptive = computeAdaptive({ today, weighIns: weights, intake, goalType, currentTarget });

  return {
    weights,
    chart,
    latest: latest ? { value: fromKg(latest.weight_kg, unit), date: latest.local_date } : null,
    avg7: last?.avg7 == null ? null : fromKg(last.avg7, unit),
    trend: last ? fromKg(last.trend, unit) : null,
    weekChange: last && weekAgo ? fromKg(last.trend, unit) - fromKg(weekAgo.trend, unit) : null,
    adaptive,
  };
}
