// Adaptive calorie recommendation.
//
// Energy balance: maintenance ≈ average intake − (rate of weight change × energy density of tissue).
// We use ~7,700 kcal/kg (≈3,500 kcal/lb). It's an approximation, which is why we require enough
// data, report confidence, and only ever SUGGEST a change — the user must approve it.

import { addDays, daysBetween, type ISODate } from "@/lib/dates";
import { KG_PER_LB } from "@/lib/units";
import { slopePerDay, weightSeries, type WeighIn } from "./weight";

export const KCAL_PER_KG = 7700;

export type GoalType = "slight_deficit" | "maintenance" | "slight_surplus" | "moderate_surplus";

/** Target weekly change in lb for each goal: [low, high]. */
export const GOAL_RATE_LB_PER_WEEK: Record<GoalType, [number, number]> = {
  slight_deficit: [-1.0, -0.5],
  maintenance: [-0.15, 0.15],
  slight_surplus: [0.25, 0.5],
  moderate_surplus: [0.5, 0.75],
};

export const GOAL_LABEL: Record<GoalType, string> = {
  slight_deficit: "Slight deficit",
  maintenance: "Maintenance",
  slight_surplus: "Slight surplus",
  moderate_surplus: "Moderate surplus",
};

export type TrendStatus = "decreasing" | "stable" | "increasing_slowly" | "increasing_quickly";

export interface IntakeDay {
  date: ISODate;
  calories: number;
  /** user marked the day as fully logged */
  complete: boolean;
}

export interface AdaptiveInput {
  today: ISODate;
  weighIns: WeighIn[];
  intake: IntakeDay[];
  goalType: GoalType;
  currentTarget: number;
  windowDays?: number;
}

export interface AdaptiveResult {
  confidence: "insufficient" | "low" | "medium" | "high";
  reasons: string[];
  windowDays: number;
  weighInDays: number;
  completeIntakeDays: number;
  avgIntake: number | null;
  rateLbPerWeek: number | null;
  status: TrendStatus | null;
  estimatedMaintenance: number | null;
  /** suggested new daily target, or null if no change advised */
  suggestedTarget: number | null;
  message: string;
}

export function classifyRate(lbPerWeek: number): TrendStatus {
  if (lbPerWeek < -0.15) return "decreasing";
  if (lbPerWeek <= 0.15) return "stable";
  if (lbPerWeek <= 0.6) return "increasing_slowly";
  return "increasing_quickly";
}

export const STATUS_LABEL: Record<TrendStatus, string> = {
  decreasing: "Decreasing",
  stable: "Stable",
  increasing_slowly: "Increasing slowly",
  increasing_quickly: "Increasing quickly",
};

const MAX_STEP_KCAL = 200;
const MIN_CHANGE_KCAL = 75;
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function computeAdaptive(input: AdaptiveInput): AdaptiveResult {
  const windowDays = input.windowDays ?? 21;
  const start = addDays(input.today, -(windowDays - 1));
  const inWindow = (d: ISODate) => d >= start && d <= input.today;

  // Trend over a slightly longer history so the EWMA has warmed up, then slope inside the window.
  const series = weightSeries(input.weighIns.filter((w) => w.local_date >= addDays(start, -14) && w.local_date <= input.today));
  const windowSeries = series.filter((d) => inWindow(d.date));
  const weighInDays = windowSeries.filter((d) => d.scale != null).length;
  const slope = slopePerDay(windowSeries.map((d) => ({ x: daysBetween(start, d.date), y: d.trend })));
  const rateLbPerWeek = slope == null ? null : (slope * 7) / KG_PER_LB;

  const complete = input.intake.filter((d) => inWindow(d.date) && d.complete);
  const avgIntake = complete.length ? complete.reduce((a, d) => a + d.calories, 0) / complete.length : null;

  const reasons: string[] = [];
  if (weighInDays < 10) reasons.push(`Need ≥10 weigh-in days in the last ${windowDays} (have ${weighInDays}).`);
  if (complete.length < 10) reasons.push(`Need ≥10 fully logged days in the last ${windowDays} (have ${complete.length}). Mark days complete in the diary.`);
  const span = windowSeries.length;
  if (span < 14) reasons.push("Need at least two weeks of weight history.");

  const status = rateLbPerWeek == null ? null : classifyRate(rateLbPerWeek);

  if (reasons.length || rateLbPerWeek == null || avgIntake == null || slope == null) {
    return {
      confidence: "insufficient",
      reasons,
      windowDays,
      weighInDays,
      completeIntakeDays: complete.length,
      avgIntake,
      rateLbPerWeek,
      status,
      estimatedMaintenance: null,
      suggestedTarget: null,
      message: "Not enough data yet. Keep weighing in and logging — recommendations unlock after ~2 weeks.",
    };
  }

  const coverage = Math.min(weighInDays, complete.length) / windowDays;
  const confidence = coverage >= 0.85 ? "high" : coverage >= 0.65 ? "medium" : "low";

  const estimatedMaintenance = avgIntake - slope * KCAL_PER_KG;
  const [lo, hi] = GOAL_RATE_LB_PER_WEEK[input.goalType];
  const targetRateKgPerDay = (((lo + hi) / 2) * KG_PER_LB) / 7;
  const ideal = estimatedMaintenance + targetRateKgPerDay * KCAL_PER_KG;

  let suggestedTarget: number | null = null;
  let message: string;
  const inRange = rateLbPerWeek >= lo && rateLbPerWeek <= hi;
  const delta = ideal - input.currentTarget;

  if (inRange) {
    message = `Weight is changing ${rateLbPerWeek >= 0 ? "+" : ""}${rateLbPerWeek.toFixed(2)} lb/week — within your ${lo}–${hi} lb/week goal. No change needed.`;
  } else if (Math.abs(delta) < MIN_CHANGE_KCAL) {
    message = `Rate is ${rateLbPerWeek.toFixed(2)} lb/week, slightly outside ${lo}–${hi}, but your target is already close to the estimate. Hold and re-check next week.`;
  } else {
    const step = Math.max(-MAX_STEP_KCAL, Math.min(MAX_STEP_KCAL, delta));
    suggestedTarget = roundTo(input.currentTarget + step, 25);
    message =
      rateLbPerWeek < lo
        ? `Weight trend is ${rateLbPerWeek.toFixed(2)} lb/week, below your ${lo}–${hi} lb/week goal. Consider increasing to ${suggestedTarget} kcal.`
        : `Weight trend is ${rateLbPerWeek.toFixed(2)} lb/week, faster than your ${lo}–${hi} lb/week goal. Consider reducing to ${suggestedTarget} kcal.`;
  }

  return {
    confidence,
    reasons,
    windowDays,
    weighInDays,
    completeIntakeDays: complete.length,
    avgIntake,
    rateLbPerWeek,
    status,
    estimatedMaintenance: roundTo(estimatedMaintenance, 10),
    suggestedTarget,
    message,
  };
}
