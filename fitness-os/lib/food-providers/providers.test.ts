import { describe, expect, it } from "vitest";
import { normalizeUsda } from "./usda";
import { normalizeOff } from "./openfoodfacts";

describe("USDA normalizer", () => {
  it("uses label serving for branded foods (search nutrients are per 100 g)", () => {
    const f = normalizeUsda({
      fdcId: 1,
      description: "NONFAT GREEK YOGURT",
      dataType: "Branded",
      brandOwner: "Acme",
      servingSize: 170,
      servingSizeUnit: "g",
      householdServingFullText: "1 container",
      foodNutrients: [
        { nutrientNumber: "208", value: 59, unitName: "KCAL" },
        { nutrientNumber: "203", value: 10.3, unitName: "G" },
        { nutrientNumber: "205", value: 3.6, unitName: "G" },
        { nutrientNumber: "204", value: 0.4, unitName: "G" },
      ],
    })!;
    expect(f.name).toBe("Nonfat Greek Yogurt");
    expect(f.serving_grams).toBe(170);
    expect(f.serving_label).toBe("1 container (170g)");
    expect(f.calories).toBe(100);
    expect(f.protein_g).toBe(17.5);
  });
  it("defaults generic foods to 100 g", () => {
    const f = normalizeUsda({ fdcId: 2, description: "Rice, white, cooked", dataType: "SR Legacy", foodNutrients: [{ nutrientNumber: "208", value: 130, unitName: "KCAL" }] })!;
    expect(f).toMatchObject({ serving_label: "100 g", serving_grams: 100, calories: 130, protein_g: 0 });
  });
  it("drops foods with no energy value instead of guessing", () => {
    expect(normalizeUsda({ fdcId: 3, description: "x", dataType: "Branded", foodNutrients: [] })).toBeNull();
  });
});

describe("Open Food Facts normalizer", () => {
  it("scales per-100g to the serving and flags incomplete data as estimated", () => {
    const f = normalizeOff({
      code: "3017624010701",
      product_name: "Nutella",
      brands: "Ferrero, Nutella",
      serving_size: "15 g",
      serving_quantity: "15",
      nutriments: { "energy-kcal_100g": 539, proteins_100g: 6.3, carbohydrates_100g: 57.5, fat_100g: 30.9 },
      states_tags: [],
    })!;
    expect(f).toMatchObject({ brand: "Ferrero", serving_grams: 15, calories: 81, confidence: "estimated", barcode: "3017624010701" });
    expect(f.fat_g).toBe(4.6);
  });
  it("falls back to kJ", () => {
    const f = normalizeOff({ code: "1", product_name: "X", nutriments: { energy_100g: 418.4 } })!;
    expect(f.calories).toBe(100);
  });
  it("returns null without energy data (user enters manually)", () => {
    expect(normalizeOff({ code: "1", product_name: "X", nutriments: {} })).toBeNull();
  });
});
