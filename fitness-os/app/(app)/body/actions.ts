"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { toKg } from "@/lib/units";
import { goalSchema, weightSchema } from "@/lib/validation/schemas";
import type { ActionResult } from "@/app/(app)/nutrition/actions";

export async function logWeight(raw: z.input<typeof weightSchema>): Promise<ActionResult> {
  const p = weightSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Invalid input" };
  const kg = toKg(p.data.weight, p.data.unit);
  if (kg < 20 || kg > 400) return { ok: false, error: "That weight looks out of range." };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("weight_entries").insert({
    user_id: user.id,
    weight_kg: +kg.toFixed(3),
    measured_at: p.data.measured_at,
    local_date: p.data.local_date,
    notes: p.data.notes || null,
    client_request_id: p.data.client_request_id,
  });
  if (error && error.code !== "23505") return { ok: false, error: error.message };
  revalidatePath("/body");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteWeight(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid id" };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("weight_entries").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/body");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Save a new goal version effective from a date. Used by Settings and by accepting a recommendation. */
export async function saveGoal(raw: z.input<typeof goalSchema>): Promise<ActionResult> {
  const p = goalSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Invalid input" };
  const kcalFromMacros = p.data.protein_g * 4 + p.data.carbs_g * 4 + p.data.fat_g * 9;
  if (Math.abs(kcalFromMacros - p.data.calories) > 50)
    return { ok: false, error: `Macros add up to ${Math.round(kcalFromMacros)} kcal but target is ${p.data.calories}. Reconcile them first.` };
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("nutrition_goals")
    .upsert({ user_id: user.id, ...p.data, fiber_g: p.data.fiber_g ?? null }, { onConflict: "user_id,effective_date" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
