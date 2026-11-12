"use client";

import { useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";
import { logFood } from "@/app/(app)/nutrition/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { SourceBadge } from "@/components/ui/badge";
import { scalePortion, type PortionUnit } from "@/lib/nutrition/portion";
import { MEAL_LABEL, MEALS, type Meal } from "@/lib/validation/schemas";
import type { FoodCandidate } from "@/lib/food-providers/types";
import { fmt } from "@/lib/utils";

const QUICK = [0.5, 1, 1.5, 2];

export function PortionPicker({
  food,
  date,
  meal: initialMeal,
  onBack,
  onDone,
}: {
  food: FoodCandidate;
  date: string;
  meal: Meal;
  onBack: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("1");
  const [unit, setUnit] = useState<PortionUnit>("serving");
  const [meal, setMeal] = useState<Meal>(initialMeal);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // One id per picker instance: double-taps and retries can't create duplicate entries.
  const [requestId] = useState(() => crypto.randomUUID());

  const n = Number(amount);
  const valid = n > 0 && Number.isFinite(n);
  const totals = valid ? scalePortion(food, n, unit) : null;

  const changeUnit = (u: PortionUnit) => {
    // Keep the same physical amount when switching units.
    if (valid && food.serving_grams) {
      const grams = unit === "serving" ? n * food.serving_grams : unit === "g" ? n : n * 28.3495;
      setAmount(String(+(u === "serving" ? grams / food.serving_grams : u === "g" ? grams : grams / 28.3495).toFixed(u === "serving" ? 2 : 0)));
    }
    setUnit(u);
  };

  const submit = () =>
    start(async () => {
      setError(null);
      const r = await logFood({
        client_request_id: requestId,
        entry_date: date,
        meal,
        amount: n,
        unit,
        save_to_library: true,
        food: {
          food_id: food.food_id ?? null,
          source: food.source,
          external_id: food.external_id,
          barcode: food.barcode,
          name: food.name,
          brand: food.brand,
          serving_label: food.serving_label,
          serving_grams: food.serving_grams,
          calories: food.calories,
          protein_g: food.protein_g,
          carbs_g: food.carbs_g,
          fat_g: food.fat_g,
          fiber_g: food.fiber_g,
          confidence: food.confidence,
        },
      });
      if (r.ok) onDone();
      else setError(r.error);
    });

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={16} /> Back
      </button>
      <div>
        <div className="flex items-start gap-2">
          <h3 className="flex-1 font-medium">{food.name}</h3>
          <SourceBadge source={food.source} confidence={food.confidence} />
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {food.brand ? `${food.brand} · ` : ""}
          {food.serving_label}: {fmt(food.calories)} kcal
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-4 rounded-2xl bg-surface-2 p-4 text-center">
          <div className="text-3xl font-semibold tabular">{totals ? fmt(totals.calories) : "—"}</div>
          <div className="text-xs text-muted">kcal</div>
          <div className="mt-3 grid grid-cols-3 text-sm tabular">
            <div><span className="text-protein">{totals ? fmt(totals.protein_g, 1) : "—"}g</span><div className="text-[11px] text-muted">Protein</div></div>
            <div><span className="text-carbs">{totals ? fmt(totals.carbs_g, 1) : "—"}g</span><div className="text-[11px] text-muted">Carbs</div></div>
            <div><span className="text-fat">{totals ? fmt(totals.fat_g, 1) : "—"}g</span><div className="text-[11px] text-muted">Fat</div></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount">
          <Input type="number" inputMode="decimal" step="any" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </Field>
        <Field label="Unit">
          <Select value={unit} onChange={(e) => changeUnit(e.target.value as PortionUnit)}>
            <option value="serving">{food.serving_label}</option>
            {food.serving_grams && <option value="g">grams</option>}
            {food.serving_grams && <option value="oz">ounces</option>}
          </Select>
        </Field>
      </div>
      {unit === "serving" && (
        <div className="flex gap-2">
          {QUICK.map((q) => (
            <button key={q} onClick={() => setAmount(String(q))} className="flex-1 rounded-lg bg-surface-2 py-2 text-sm hover:bg-surface-3">
              {q === 0.5 ? "½" : q === 1.5 ? "1½" : q}
            </button>
          ))}
        </div>
      )}
      <Field label="Meal">
        <Select value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>
          {MEALS.map((m) => (
            <option key={m} value={m}>
              {MEAL_LABEL[m]}
            </option>
          ))}
        </Select>
      </Field>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button size="lg" className="w-full" onClick={submit} disabled={!valid || pending}>
        {pending ? "Logging…" : `Add to ${MEAL_LABEL[meal]}`}
      </Button>
    </div>
  );
}
