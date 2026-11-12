import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/supabase/server";
import { todayIn } from "@/lib/dates";
import type { NutritionGoal, Profile } from "@/types/db";

// Postgres numeric comes back as string from PostgREST in some configs; normalize.
export function toNum<T extends object>(row: T, keys: (keyof T)[]): T {
  const out = { ...row } as Record<keyof T, unknown>;
  for (const k of keys) if (out[k] != null) out[k] = Number(out[k]);
  return out as T;
}

export const getSession = cache(async () => {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("id, display_name, height_cm, weight_unit, length_unit, timezone").eq("id", user.id).single();
  const p: Profile = profile ?? { id: user.id, display_name: null, height_cm: null, weight_unit: "lb", length_unit: "in", timezone: "America/New_York" };
  return { supabase, user, profile: p, today: todayIn(p.timezone) };
});

/** Goal in effect on a date: most recent effective_date <= date. */
export async function getGoalForDate(date: string): Promise<NutritionGoal | null> {
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("nutrition_goals")
    .select("id, effective_date, goal_type, calories, protein_g, carbs_g, fat_g, fiber_g")
    .lte("effective_date", date)
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) return toNum(data as NutritionGoal, ["calories", "protein_g", "carbs_g", "fat_g", "fiber_g"]);
  // Fallback: earliest goal (e.g. browsing a date before the account existed)
  const { data: first } = await supabase
    .from("nutrition_goals")
    .select("id, effective_date, goal_type, calories, protein_g, carbs_g, fat_g, fiber_g")
    .order("effective_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  return first ? toNum(first as NutritionGoal, ["calories", "protein_g", "carbs_g", "fat_g", "fiber_g"]) : null;
}
