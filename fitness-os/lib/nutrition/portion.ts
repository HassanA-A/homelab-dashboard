import { G_PER_OZ } from "@/lib/units";
import type { Macros } from "./macros";

export type PortionUnit = "serving" | "g" | "oz";

export interface FoodBasis extends Macros {
  serving_label: string;
  /** grams in one serving, if known. Required to log in g/oz. */
  serving_grams: number | null;
}

/** How many servings a given amount + unit represents. */
export function servingsFor(basis: Pick<FoodBasis, "serving_grams">, amount: number, unit: PortionUnit): number {
  if (unit === "serving") return amount;
  if (!basis.serving_grams) throw new Error("This food has no gram weight; log it in servings.");
  const grams = unit === "g" ? amount : amount * G_PER_OZ;
  return grams / basis.serving_grams;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Scale a per-serving basis to the amount eaten. This is the snapshot written to food_entries. */
export function scalePortion(basis: FoodBasis, amount: number, unit: PortionUnit): Required<Macros> {
  const s = servingsFor(basis, amount, unit);
  return {
    calories: r1(basis.calories * s),
    protein_g: r1(basis.protein_g * s),
    carbs_g: r1(basis.carbs_g * s),
    fat_g: r1(basis.fat_g * s),
    fiber_g: basis.fiber_g == null ? 0 : r1(basis.fiber_g * s),
  };
}
