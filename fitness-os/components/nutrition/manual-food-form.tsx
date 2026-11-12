"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { caloriesFromMacros } from "@/lib/nutrition/macros";
import { manualFoodSchema, type ManualFoodInput } from "@/lib/validation/schemas";
import type { FoodCandidate } from "@/lib/food-providers/types";

/** Create a custom food, then continue to the portion picker. Pre-fills barcode if we came from a failed scan. */
export function ManualFoodForm({ barcode, onCreated }: { barcode?: string | null; onCreated: (f: FoodCandidate) => void }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ManualFoodInput>({
    resolver: zodResolver(manualFoodSchema) as never,
    defaultValues: { serving_label: "1 serving", confidence: "user", calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  });

  const [cal, p, c, f] = watch(["calories", "protein_g", "carbs_g", "fat_g"]);
  const fromMacros = caloriesFromMacros({ protein_g: Number(p) || 0, carbs_g: Number(c) || 0, fat_g: Number(f) || 0 });
  const mismatch = Number(cal) > 0 && fromMacros > 0 && Math.abs(fromMacros - Number(cal)) / Number(cal) > 0.15;

  const submit = (v: ManualFoodInput) =>
    onCreated({
      source: "custom",
      external_id: null,
      barcode: barcode ?? null,
      name: v.name,
      brand: v.brand || null,
      serving_label: v.serving_label,
      serving_grams: v.serving_grams === "" || v.serving_grams == null ? null : Number(v.serving_grams),
      calories: Number(v.calories),
      protein_g: Number(v.protein_g),
      carbs_g: Number(v.carbs_g),
      fat_g: Number(v.fat_g),
      fiber_g: v.fiber_g === "" || v.fiber_g == null ? null : Number(v.fiber_g),
      confidence: v.confidence,
    });

  const num = { type: "number", inputMode: "decimal", step: "any", min: 0 } as const;

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-3">
      {barcode && <p className="rounded-xl bg-surface-2 p-3 text-xs text-muted">Barcode {barcode} wasn&apos;t found. Enter it from the label and it&apos;ll be recognized next time.</p>}
      <Field label="Food name" error={errors.name?.message}>
        <Input {...register("name")} placeholder="e.g. Chicken burrito bowl" autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Brand (optional)">
          <Input {...register("brand")} />
        </Field>
        <Field label="Confidence">
          <Select {...register("confidence")}>
            <option value="user">From label</option>
            <option value="estimated">Estimate</option>
          </Select>
        </Field>
        <Field label="Serving" error={errors.serving_label?.message}>
          <Input {...register("serving_label")} placeholder="1 bar" />
        </Field>
        <Field label="Serving weight (g)" error={errors.serving_grams?.message}>
          <Input {...num} {...register("serving_grams")} placeholder="optional" />
        </Field>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Field label="kcal" error={errors.calories?.message}>
          <Input {...num} {...register("calories")} />
        </Field>
        <Field label="Protein">
          <Input {...num} {...register("protein_g")} />
        </Field>
        <Field label="Carbs">
          <Input {...num} {...register("carbs_g")} />
        </Field>
        <Field label="Fat">
          <Input {...num} {...register("fat_g")} />
        </Field>
      </div>
      <Field label="Fiber (g, optional)">
        <Input {...num} {...register("fiber_g")} />
      </Field>
      {mismatch && (
        <p className="text-xs text-warn">
          Macros add up to ~{Math.round(fromMacros)} kcal, which differs from {cal} kcal. Double-check the label (alcohol and sugar alcohols can explain small gaps).
        </p>
      )}
      <Button type="submit" size="lg" className="w-full">
        Continue
      </Button>
    </form>
  );
}
