import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchUsda } from "@/lib/food-providers/usda";
import { searchOff } from "@/lib/food-providers/openfoodfacts";
import type { FoodCandidate } from "@/lib/food-providers/types";

// GET /api/foods/search?q=greek+yogurt&source=all|usda|off
// Searches the user's own library first, then external providers server-side (keys stay private).
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const source = req.nextUrl.searchParams.get("source") ?? "all";
  if (q.length < 2) return NextResponse.json({ results: [], errors: [] });

  const signal = AbortSignal.timeout(8000);
  const errors: string[] = [];

  const libraryP = supabase
    .from("foods")
    .select("id, source, external_id, barcode, name, brand, serving_label, serving_grams, calories, protein_g, carbs_g, fat_g, fiber_g, confidence")
    .is("archived_at", null)
    .ilike("name", `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`)
    .order("use_count", { ascending: false })
    .limit(10);

  const wrap = (p: Promise<FoodCandidate[]>, name: string) =>
    p.catch((e: unknown) => {
      errors.push(e instanceof Error ? e.message : `${name} failed`);
      return [] as FoodCandidate[];
    });

  const [library, usda, off] = await Promise.all([
    libraryP,
    source === "off" ? Promise.resolve([]) : wrap(searchUsda(q, signal), "USDA"),
    source === "usda" ? Promise.resolve([]) : wrap(searchOff(q, signal), "Open Food Facts"),
  ]);

  const libResults: FoodCandidate[] = (library.data ?? []).map((f) => ({
    ...f,
    food_id: f.id,
    serving_grams: f.serving_grams == null ? null : Number(f.serving_grams),
    calories: Number(f.calories),
    protein_g: Number(f.protein_g),
    carbs_g: Number(f.carbs_g),
    fat_g: Number(f.fat_g),
    fiber_g: f.fiber_g == null ? null : Number(f.fiber_g),
  }));

  // Drop external results that are already in the library.
  const seen = new Set(libResults.map((f) => `${f.source}:${f.external_id}`));
  const external = [...usda, ...off].filter((f) => !seen.has(`${f.source}:${f.external_id}`));

  return NextResponse.json({ results: [...libResults, ...external], errors });
}
