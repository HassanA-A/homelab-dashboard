import { describe, expect, it } from "vitest";
import { caloriesFromMacros, macroMismatch, reconcileCarbs } from "./macros";
import { scalePortion } from "./portion";

describe("macros", () => {
  it("the proposed 2600 / 140P / 330C / 75F doesn't add up; reconciled carbs = 341g", () => {
    expect(caloriesFromMacros({ protein_g: 140, carbs_g: 330, fat_g: 75 })).toBe(2555);
    expect(macroMismatch({ calories: 2600, protein_g: 140, carbs_g: 330, fat_g: 75 })).toBe(-45);
    expect(reconcileCarbs(2600, 140, 75)).toBe(341);
  });
  it("returns null when protein+fat exceed calories", () => {
    expect(reconcileCarbs(1000, 200, 60)).toBeNull();
  });
});

describe("portion scaling", () => {
  const basis = { serving_label: "1 cup (240g)", serving_grams: 240, calories: 120, protein_g: 10, carbs_g: 12, fat_g: 4, fiber_g: 0 };
  it("scales half servings", () => {
    expect(scalePortion(basis, 0.5, "serving")).toMatchObject({ calories: 60, protein_g: 5 });
  });
  it("scales grams", () => {
    expect(scalePortion(basis, 360, "g").calories).toBe(180);
  });
  it("scales ounces", () => {
    expect(scalePortion(basis, 1, "oz").calories).toBeCloseTo(14.2, 1);
  });
  it("refuses grams without a gram weight", () => {
    expect(() => scalePortion({ ...basis, serving_grams: null }, 100, "g")).toThrow();
  });
});
