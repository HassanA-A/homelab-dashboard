import { z } from "zod";

export const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type Meal = (typeof MEALS)[number];
export const MEAL_LABEL: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snacks" };

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
const nonNeg = (max: number) => z.coerce.number().min(0).max(max);

/** A food's per-serving definition, from a provider, the user's library, or manual entry. */
export const foodBasisSchema = z.object({
  food_id: z.string().uuid().nullish(),
  source: z.enum(["usda", "off", "custom", "recipe"]),
  external_id: z.string().max(64).nullish(),
  barcode: z.string().max(32).nullish(),
  name: z.string().trim().min(1, "Name is required").max(200),
  brand: z.string().trim().max(120).nullish(),
  serving_label: z.string().trim().min(1).max(80),
  serving_grams: z.coerce.number().positive().max(5000).nullish(),
  calories: nonNeg(5000),
  protein_g: nonNeg(500),
  carbs_g: nonNeg(1000),
  fat_g: nonNeg(500),
  fiber_g: nonNeg(200).nullish(),
  confidence: z.enum(["verified", "user", "estimated"]),
});
export type FoodBasisInput = z.infer<typeof foodBasisSchema>;

export const logFoodSchema = z
  .object({
    client_request_id: z.string().uuid(),
    entry_date: isoDate,
    meal: z.enum(MEALS),
    amount: z.coerce.number().positive("Amount must be > 0").max(10000),
    unit: z.enum(["serving", "g", "oz"]),
    food: foodBasisSchema,
    save_to_library: z.boolean().default(true),
  })
  .refine((v) => v.unit === "serving" || !!v.food.serving_grams, {
    message: "This food has no gram weight; log it in servings.",
    path: ["unit"],
  });
export type LogFoodInput = z.infer<typeof logFoodSchema>;

/** Manual food form (react-hook-form). */
export const manualFoodSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  brand: z.string().trim().max(120).optional(),
  serving_label: z.string().trim().min(1, "e.g. 1 bar, 1 cup").max(80),
  serving_grams: z.union([z.literal(""), z.coerce.number().positive().max(5000)]).optional(),
  calories: z.coerce.number().min(0).max(5000),
  protein_g: z.coerce.number().min(0).max(500),
  carbs_g: z.coerce.number().min(0).max(1000),
  fat_g: z.coerce.number().min(0).max(500),
  fiber_g: z.union([z.literal(""), z.coerce.number().min(0).max(200)]).optional(),
  confidence: z.enum(["user", "estimated"]),
  notes: z.string().max(500).optional(),
});
export type ManualFoodInput = z.infer<typeof manualFoodSchema>;

export const updateEntrySchema = z.object({
  id: z.string().uuid(),
  amount: z.coerce.number().positive().max(10000),
  unit: z.enum(["serving", "g", "oz"]),
  meal: z.enum(MEALS),
});

export const goalSchema = z.object({
  goal_type: z.enum(["slight_deficit", "maintenance", "slight_surplus", "moderate_surplus"]),
  calories: z.coerce.number().int().min(1000).max(8000),
  protein_g: z.coerce.number().min(0).max(500),
  fat_g: z.coerce.number().min(0).max(400),
  carbs_g: z.coerce.number().min(0).max(1000),
  fiber_g: z.coerce.number().min(0).max(150).optional(),
  effective_date: isoDate,
  source: z.enum(["manual", "recommendation"]).default("manual"),
});
export type GoalInput = z.infer<typeof goalSchema>;

export const weightSchema = z.object({
  client_request_id: z.string().uuid(),
  weight: z.coerce.number().positive().max(900),
  unit: z.enum(["lb", "kg"]),
  local_date: isoDate,
  measured_at: z.string().datetime({ offset: true }),
  notes: z.string().max(300).optional(),
});

export const profileSchema = z.object({
  display_name: z.string().trim().max(80).optional(),
  weight_unit: z.enum(["lb", "kg"]),
  timezone: z.string().min(1).max(64),
  height_cm: z.union([z.literal(""), z.coerce.number().min(50).max(260)]).optional(),
});
