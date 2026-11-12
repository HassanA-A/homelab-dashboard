export const KG_PER_LB = 0.45359237;
export const G_PER_OZ = 28.349523125;

export type WeightUnit = "lb" | "kg";

export const toKg = (value: number, unit: WeightUnit) => (unit === "kg" ? value : value * KG_PER_LB);
export const fromKg = (kg: number, unit: WeightUnit) => (unit === "kg" ? kg : kg / KG_PER_LB);
