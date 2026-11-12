"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { scalePortion, servingsFor } from "@/lib/nutrition/portion";
import { isoDate, logFoodSchema, MEALS, updateEntrySchema, type LogFoodInput } from "@/lib/validation/schemas";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const fail = (error: string): ActionResult<never> => ({ ok: false, error });
const done = () => {
  revalidatePath("/nutrition");
  revalidatePath("/dashboard");
};

/**
 * Log a food to the diary. Writes a nutrition SNAPSHOT so later edits to the food (or upstream
 * database changes) never alter history. Idempotent on client_request_id: a retried submit is a no-op.
 */
export async function logFood(raw: LogFoodInput): Promise<ActionResult> {
  const parsed = logFoodSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const { food, amount, unit, entry_date, meal, client_request_id, save_to_library } = parsed.data;
  const { supabase, user } = await requireUser();

  let totals;
  try {
    totals = scalePortion({ ...food, serving_grams: food.serving_grams ?? null, fiber_g: food.fiber_g ?? null }, amount, unit);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Invalid portion");
  }

  // Keep the personal library in sync (recents / favorites / barcode cache).
  let foodId = food.food_id ?? null;
  if (save_to_library) {
    if (foodId) {
      const { data: f } = await supabase.from("foods").select("use_count").eq("id", foodId).single();
      await supabase.from("foods").update({ use_count: (f?.use_count ?? 0) + 1, last_used_at: new Date().toISOString() }).eq("id", foodId);
    } else {
      const { data: f, error } = await supabase
        .from("foods")
        .upsert(
          {
            user_id: user.id,
            source: food.source,
            external_id: food.external_id ?? null,
            barcode: food.barcode ?? null,
            name: food.name,
            brand: food.brand ?? null,
            serving_label: food.serving_label,
            serving_grams: food.serving_grams ?? null,
            calories: food.calories,
            protein_g: food.protein_g,
            carbs_g: food.carbs_g,
            fat_g: food.fat_g,
            fiber_g: food.fiber_g ?? null,
            confidence: food.confidence,
            use_count: 1,
            last_used_at: new Date().toISOString(),
          },
          { onConflict: "user_id,source,external_id" },
        )
        .select("id")
        .single();
      if (error) return fail(`Couldn't save food: ${error.message}`);
      foodId = f.id;
    }
  }

  const { error } = await supabase.from("food_entries").insert({
    user_id: user.id,
    entry_date,
    meal,
    food_id: foodId,
    food_name: food.name,
    brand: food.brand ?? null,
    source: food.source,
    confidence: food.confidence,
    serving_label: food.serving_label,
    serving_grams: food.serving_grams ?? null,
    amount,
    unit,
    ...totals,
    client_request_id,
  });
  if (error && error.code !== "23505") return fail(`Couldn't log food: ${error.message}`);
  done();
  return { ok: true };
}

const quickAddSchema = z.object({
  client_request_id: z.string().uuid(),
  entry_date: isoDate,
  meal: z.enum(MEALS),
  name: z.string().trim().max(120).default("Quick add"),
  calories: z.coerce.number().min(0).max(5000),
  protein_g: z.coerce.number().min(0).max(500).default(0),
  carbs_g: z.coerce.number().min(0).max(1000).default(0),
  fat_g: z.coerce.number().min(0).max(500).default(0),
});

/** Calories/macros only, no food. Marked as an estimate. */
export async function quickAdd(raw: z.input<typeof quickAddSchema>): Promise<ActionResult> {
  const p = quickAddSchema.safeParse(raw);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Invalid input");
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("food_entries").insert({
    user_id: user.id,
    entry_date: p.data.entry_date,
    meal: p.data.meal,
    food_name: p.data.name || "Quick add",
    source: "quick",
    confidence: "estimated",
    serving_label: "entry",
    amount: 1,
    unit: "serving",
    calories: p.data.calories,
    protein_g: p.data.protein_g,
    carbs_g: p.data.carbs_g,
    fat_g: p.data.fat_g,
    client_request_id: p.data.client_request_id,
  });
  if (error && error.code !== "23505") return fail(error.message);
  done();
  return { ok: true };
}

/** Change amount/unit/meal. Rescales from the entry's own snapshot, not the (possibly edited) library food. */
export async function updateEntry(raw: z.input<typeof updateEntrySchema>): Promise<ActionResult> {
  const p = updateEntrySchema.safeParse(raw);
  if (!p.success) return fail(p.error.issues[0]?.message ?? "Invalid input");
  const { supabase } = await requireUser();
  const { data: e, error: readErr } = await supabase
    .from("food_entries")
    .select("amount, unit, serving_grams, serving_label, calories, protein_g, carbs_g, fat_g, fiber_g")
    .eq("id", p.data.id)
    .single();
  if (readErr || !e) return fail("Entry not found");

  // Recover the per-serving basis from the stored totals, then rescale.
  const grams = e.serving_grams == null ? null : Number(e.serving_grams);
  const basisFor = (amount: number, unit: "serving" | "g" | "oz") => {
    const servings = servingsFor({ serving_grams: grams }, Number(e.amount), e.unit) || 1;
    return scalePortion(
      {
        serving_label: e.serving_label,
        serving_grams: grams,
        calories: Number(e.calories) / servings,
        protein_g: Number(e.protein_g) / servings,
        carbs_g: Number(e.carbs_g) / servings,
        fat_g: Number(e.fat_g) / servings,
        fiber_g: e.fiber_g == null ? null : Number(e.fiber_g) / servings,
      },
      amount,
      unit,
    );
  };

  let totals;
  try {
    totals = basisFor(p.data.amount, p.data.unit);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Invalid portion");
  }
  const { error } = await supabase
    .from("food_entries")
    .update({ amount: p.data.amount, unit: p.data.unit, meal: p.data.meal, ...totals, fiber_g: e.fiber_g == null ? null : totals.fiber_g })
    .eq("id", p.data.id);
  if (error) return fail(error.message);
  done();
  return { ok: true };
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return fail("Invalid id");
  const { supabase } = await requireUser();
  const { error } = await supabase.from("food_entries").delete().eq("id", id);
  if (error) return fail(error.message);
  done();
  return { ok: true };
}

const copySchema = z.object({
  from: isoDate,
  to: isoDate,
  fromMeal: z.enum(MEALS).nullish(),
  toMeal: z.enum(MEALS).nullish(),
});

/** Copy a whole day, or one meal, to another date (single transaction via RPC). */
export async function copyMeal(raw: z.input<typeof copySchema>): Promise<ActionResult<number>> {
  const p = copySchema.safeParse(raw);
  if (!p.success) return fail("Invalid input");
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("copy_meal", {
    p_from_date: p.data.from,
    p_to_date: p.data.to,
    p_from_meal: p.data.fromMeal ?? null,
    p_to_meal: p.data.toMeal ?? null,
  });
  if (error) return fail(error.message);
  done();
  return { ok: true, data: data as number };
}

export async function setDayComplete(date: string, complete: boolean): Promise<ActionResult> {
  if (!isoDate.safeParse(date).success) return fail("Invalid date");
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("day_logs").upsert({ user_id: user.id, log_date: date, is_complete: complete }, { onConflict: "user_id,log_date" });
  if (error) return fail(error.message);
  done();
  return { ok: true };
}

export async function toggleFavorite(foodId: string, favorite: boolean): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(foodId).success) return fail("Invalid id");
  const { supabase } = await requireUser();
  const { error } = await supabase.from("foods").update({ is_favorite: favorite }).eq("id", foodId);
  if (error) return fail(error.message);
  revalidatePath("/nutrition");
  return { ok: true };
}
