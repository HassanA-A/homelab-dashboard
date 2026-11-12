import "server-only";
import { ProviderError, type FoodCandidate } from "./types";

// Open Food Facts. Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
const UA = () => process.env.OFF_USER_AGENT || "FitnessOS/0.1 (personal use)";
const FIELDS = "code,product_name,brands,serving_size,serving_quantity,nutriments,image_front_small_url,states_tags";

interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
  image_front_small_url?: string;
  states_tags?: string[];
}

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

export function normalizeOff(p: OffProduct): FoodCandidate | null {
  const n = p.nutriments ?? {};
  const kcal100 = num(n["energy-kcal_100g"]) ?? (num(n["energy_100g"]) != null ? num(n["energy_100g"])! / 4.184 : null);
  if (kcal100 == null || !p.product_name) return null; // missing data → let the user enter it manually

  const servingQty = num(p.serving_quantity);
  const grams = servingQty && servingQty > 0 ? servingQty : 100;
  const k = grams / 100;
  const g = (key: string) => num(n[`${key}_100g`]);

  // OFF is crowd-sourced; treat as verified only when the community marked nutrition complete.
  const complete = p.states_tags?.includes("en:nutrition-facts-completed") ?? false;

  return {
    source: "off",
    external_id: p.code ?? null,
    barcode: p.code ?? null,
    name: p.product_name.trim(),
    brand: p.brands?.split(",")[0]?.trim() || null,
    serving_label: servingQty ? p.serving_size || `${grams} g` : "100 g",
    serving_grams: grams,
    calories: Math.round(kcal100 * k),
    protein_g: +((g("proteins") ?? 0) * k).toFixed(1),
    carbs_g: +((g("carbohydrates") ?? 0) * k).toFixed(1),
    fat_g: +((g("fat") ?? 0) * k).toFixed(1),
    fiber_g: g("fiber") == null ? null : +(g("fiber")! * k).toFixed(1),
    confidence: complete ? "verified" : "estimated",
    image_url: p.image_front_small_url ?? null,
  };
}

export async function lookupBarcode(code: string, signal?: AbortSignal): Promise<FoodCandidate | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`, {
    headers: { "User-Agent": UA() },
    signal,
    next: { revalidate: 60 * 60 * 24 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new ProviderError("Open Food Facts", `HTTP ${res.status}`, res.status);
  const json = (await res.json()) as { status?: number; product?: OffProduct };
  if (json.status !== 1 || !json.product) return null;
  return normalizeOff({ ...json.product, code: json.product.code ?? code });
}

export async function searchOff(query: string, signal?: AbortSignal): Promise<FoodCandidate[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.search = new URLSearchParams({ search_terms: query, search_simple: "1", json: "1", page_size: "20", fields: FIELDS }).toString();
  const res = await fetch(url, { headers: { "User-Agent": UA() }, signal, next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) throw new ProviderError("Open Food Facts", `HTTP ${res.status}`, res.status);
  const json = (await res.json()) as { products?: OffProduct[] };
  return (json.products ?? []).map(normalizeOff).filter((x): x is FoodCandidate => x !== null);
}
