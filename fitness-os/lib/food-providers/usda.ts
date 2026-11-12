import "server-only";
import { ProviderError, type FoodCandidate } from "./types";

// USDA FoodData Central. Docs: https://fdc.nal.usda.gov/api-guide
const BASE = "https://api.nal.usda.gov/fdc/v1";

// Nutrient numbers are stable across data types; ids differ between Branded/Foundation.
const N = { kcal: ["208", "957", "958"], protein: ["203"], fat: ["204"], carbs: ["205"], fiber: ["291"] };

interface UsdaNutrient {
  nutrientNumber?: string;
  value?: number;
  unitName?: string;
}
interface UsdaFood {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients: UsdaNutrient[];
}

function pick(nutrients: UsdaNutrient[], numbers: string[]): number | null {
  for (const num of numbers) {
    const n = nutrients.find((x) => x.nutrientNumber === num && typeof x.value === "number");
    if (n) {
      // 268 is kJ; we only request kcal numbers above, but guard anyway.
      return n.unitName?.toLowerCase() === "kj" ? n.value! / 4.184 : n.value!;
    }
  }
  return null;
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Search results report nutrients per 100 g (for every data type). Branded foods also carry a
 * label serving size, which we prefer so "1 bar" works; otherwise default to 100 g.
 */
export function normalizeUsda(f: UsdaFood): FoodCandidate | null {
  const per100 = {
    kcal: pick(f.foodNutrients, N.kcal),
    protein: pick(f.foodNutrients, N.protein) ?? 0,
    carbs: pick(f.foodNutrients, N.carbs) ?? 0,
    fat: pick(f.foodNutrients, N.fat) ?? 0,
    fiber: pick(f.foodNutrients, N.fiber),
  };
  if (per100.kcal == null) return null; // never fabricate

  const unit = f.servingSizeUnit?.toLowerCase();
  const hasGramServing = f.servingSize && (unit === "g" || unit === "grm" || unit === "ml" || unit === "mlt");
  const grams = hasGramServing ? f.servingSize! : 100;
  const label = hasGramServing
    ? `${f.householdServingFullText ? `${f.householdServingFullText} ` : ""}(${Math.round(grams)}${unit?.startsWith("m") ? "ml" : "g"})`
    : "100 g";
  const k = grams / 100;

  return {
    source: "usda",
    external_id: String(f.fdcId),
    barcode: f.gtinUpc ?? null,
    name: f.dataType === "Branded" ? titleCase(f.description) : f.description,
    brand: f.brandName ?? f.brandOwner ?? null,
    serving_label: label,
    serving_grams: grams,
    calories: Math.round(per100.kcal * k),
    protein_g: +(per100.protein * k).toFixed(1),
    carbs_g: +(per100.carbs * k).toFixed(1),
    fat_g: +(per100.fat * k).toFixed(1),
    fiber_g: per100.fiber == null ? null : +(per100.fiber * k).toFixed(1),
    // Foundation / SR Legacy are lab-analyzed; Branded are label-declared (still authoritative).
    confidence: "verified",
  };
}

export async function searchUsda(query: string, signal?: AbortSignal): Promise<FoodCandidate[]> {
  const key = process.env.USDA_API_KEY || "DEMO_KEY";
  const res = await fetch(`${BASE}/foods/search?api_key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      pageSize: 25,
      dataType: ["Foundation", "SR Legacy", "Branded"],
    }),
    signal,
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) throw new ProviderError("USDA", res.status === 429 ? "rate limited — set USDA_API_KEY" : `HTTP ${res.status}`, res.status);
  const json = (await res.json()) as { foods?: UsdaFood[] };
  return (json.foods ?? []).map(normalizeUsda).filter((x): x is FoodCandidate => x !== null);
}
