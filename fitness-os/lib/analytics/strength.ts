export type SetType = "warmup" | "working" | "drop" | "failure";

export interface SetLike {
  weight_kg: number | null;
  reps: number | null;
  rir?: number | null;
  set_type: SetType;
}

export const isWorkSet = (s: SetLike) => s.set_type !== "warmup";

/**
 * Estimated 1RM (Epley), using reps-in-reserve to estimate reps-to-failure.
 * Returns null above 12 reps-to-failure where formulas are unreliable.
 */
export function estimated1RM(weight: number, reps: number, rir = 0): number | null {
  if (weight <= 0 || reps <= 0) return null;
  const rtf = reps + Math.max(0, rir);
  if (rtf > 12) return null;
  if (rtf === 1) return weight;
  return weight * (1 + rtf / 30);
}

/** Volume load (weight × reps) of non-warm-up sets. */
export function volume(sets: SetLike[]): number {
  return sets.filter(isWorkSet).reduce((a, s) => a + (s.weight_kg ?? 0) * (s.reps ?? 0), 0);
}

export function workingSetCount(sets: SetLike[]): number {
  return sets.filter((s) => isWorkSet(s) && (s.reps ?? 0) > 0).length;
}

export function bestE1RM(sets: SetLike[]): number | null {
  let best: number | null = null;
  for (const s of sets.filter(isWorkSet)) {
    if (s.weight_kg == null || s.reps == null) continue;
    const e = estimated1RM(s.weight_kg, s.reps, s.rir ?? 0);
    if (e != null && (best == null || e > best)) best = e;
  }
  return best;
}
