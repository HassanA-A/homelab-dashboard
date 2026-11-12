import "server-only";
import { getSession } from "@/lib/data";
import type { WeightEntry } from "@/types/db";

export async function getWeights(from: string): Promise<WeightEntry[]> {
  const { supabase } = await getSession();
  const { data, error } = await supabase
    .from("weight_entries")
    .select("id, weight_kg, measured_at, local_date, notes")
    .gte("local_date", from)
    .order("measured_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((w) => ({ ...w, weight_kg: Number(w.weight_kg) }));
}
