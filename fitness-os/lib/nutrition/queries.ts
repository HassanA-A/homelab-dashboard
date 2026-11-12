import "server-only";
import { getSession } from "@/lib/data";
import type { FoodEntry } from "@/types/db";
import type { LibraryFood } from "@/components/nutrition/add-food-sheet";

const n = (v: unknown) => (v == null ? null : Number(v));

export async function getEntries(date: string): Promise<FoodEntry[]> {
  const { supabase } = await getSession();
  const { data, error } = await supabase
    .from("food_entries")
    .select("id, entry_date, meal, food_id, food_name, brand, source, confidence, serving_label, serving_grams, amount, unit, calories, protein_g, carbs_g, fat_g, fiber_g, created_at")
    .eq("entry_date", date)
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((e) => ({
    ...e,
    serving_grams: n(e.serving_grams),
    amount: Number(e.amount),
    calories: Number(e.calories),
    protein_g: Number(e.protein_g),
    carbs_g: Number(e.carbs_g),
    fat_g: Number(e.fat_g),
    fiber_g: n(e.fiber_g),
  })) as FoodEntry[];
}

export async function getRecentFoods(limit = 40): Promise<LibraryFood[]> {
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("foods")
    .select("id, source, external_id, barcode, name, brand, serving_label, serving_grams, calories, protein_g, carbs_g, fat_g, fiber_g, confidence, is_favorite")
    .is("archived_at", null)
    .order("is_favorite", { ascending: false })
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data ?? []).map((f) => ({
    ...f,
    food_id: f.id,
    serving_grams: n(f.serving_grams),
    calories: Number(f.calories),
    protein_g: Number(f.protein_g),
    carbs_g: Number(f.carbs_g),
    fat_g: Number(f.fat_g),
    fiber_g: n(f.fiber_g),
  })) as LibraryFood[];
}

/** Daily totals between two dates (inclusive), plus completeness flags. */
export async function getDailyTotals(from: string, to: string) {
  const { supabase } = await getSession();
  const [totals, days] = await Promise.all([
    supabase.from("daily_nutrition").select("entry_date, calories, protein_g, carbs_g, fat_g").gte("entry_date", from).lte("entry_date", to),
    supabase.from("day_logs").select("log_date, is_complete").gte("log_date", from).lte("log_date", to),
  ]);
  const complete = new Map((days.data ?? []).map((d) => [d.log_date as string, d.is_complete as boolean]));
  return (totals.data ?? []).map((t) => ({
    date: t.entry_date as string,
    calories: Number(t.calories),
    protein_g: Number(t.protein_g),
    carbs_g: Number(t.carbs_g),
    fat_g: Number(t.fat_g),
    complete: complete.get(t.entry_date as string) ?? false,
  }));
}
