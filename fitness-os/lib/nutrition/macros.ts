// Macro math. Calories are the source of truth; carbs are derived so targets always reconcile.

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

export interface Macros {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number | null;
}

export function caloriesFromMacros(m: Pick<Macros, "protein_g" | "carbs_g" | "fat_g">): number {
  return m.protein_g * KCAL_PER_G.protein + m.carbs_g * KCAL_PER_G.carbs + m.fat_g * KCAL_PER_G.fat;
}

/** Given calories, protein and fat, fill the remainder with carbs. Returns null if P+F already exceed calories. */
export function reconcileCarbs(calories: number, protein_g: number, fat_g: number): number | null {
  const remaining = calories - protein_g * KCAL_PER_G.protein - fat_g * KCAL_PER_G.fat;
  if (remaining < 0) return null;
  return Math.round(remaining / KCAL_PER_G.carbs);
}

/** Difference between stated calories and what the macros add up to (positive = macros exceed calories). */
export function macroMismatch(m: Macros): number {
  return Math.round(caloriesFromMacros(m) - m.calories);
}

export function sumMacros(items: Macros[]): Required<Macros> {
  return items.reduce<Required<Macros>>(
    (acc, i) => ({
      calories: acc.calories + i.calories,
      protein_g: acc.protein_g + i.protein_g,
      carbs_g: acc.carbs_g + i.carbs_g,
      fat_g: acc.fat_g + i.fat_g,
      fiber_g: (acc.fiber_g ?? 0) + (i.fiber_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
  );
}
