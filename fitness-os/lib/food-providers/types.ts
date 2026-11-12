export type FoodSource = "usda" | "off" | "custom" | "recipe";
export type Confidence = "verified" | "user" | "estimated";

/** A normalized search result from any provider. Nutrients are per serving. */
export interface FoodCandidate {
  source: FoodSource;
  external_id: string | null;
  barcode: string | null;
  name: string;
  brand: string | null;
  serving_label: string;
  serving_grams: number | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  confidence: Confidence;
  /** for local library hits */
  food_id?: string;
  image_url?: string | null;
}

export class ProviderError extends Error {
  constructor(public provider: string, message: string, public status?: number) {
    super(`${provider}: ${message}`);
  }
}
