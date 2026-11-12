// Row shapes used by the app. Regenerate a full typed client later with:
//   npx supabase gen types typescript --project-id <id> > types/supabase.ts
import type { Confidence } from "@/lib/food-providers/types";
import type { GoalType } from "@/lib/analytics/adaptive";
import type { Meal } from "@/lib/validation/schemas";
import type { PortionUnit } from "@/lib/nutrition/portion";

export interface Profile {
  id: string;
  display_name: string | null;
  height_cm: number | null;
  weight_unit: "lb" | "kg";
  length_unit: "in" | "cm";
  timezone: string;
}

export interface NutritionGoal {
  id: string;
  effective_date: string;
  goal_type: GoalType;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
}

export interface FoodEntry {
  id: string;
  entry_date: string;
  meal: Meal;
  food_id: string | null;
  food_name: string;
  brand: string | null;
  source: "usda" | "off" | "custom" | "recipe" | "quick";
  confidence: Confidence;
  serving_label: string;
  serving_grams: number | null;
  amount: number;
  unit: PortionUnit;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  created_at: string;
}

export interface SavedFood {
  id: string;
  source: "usda" | "off" | "custom" | "recipe";
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
  is_favorite: boolean;
  use_count: number;
  last_used_at: string | null;
}

export interface WeightEntry {
  id: string;
  weight_kg: number;
  measured_at: string;
  local_date: string;
  notes: string | null;
}
