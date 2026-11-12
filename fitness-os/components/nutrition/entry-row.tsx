"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteEntry, updateEntry } from "@/app/(app)/nutrition/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { SourceBadge } from "@/components/ui/badge";
import { MEAL_LABEL, MEALS, type Meal } from "@/lib/validation/schemas";
import { fmt } from "@/lib/utils";
import type { FoodEntry } from "@/types/db";

const unitLabel = (e: Pick<FoodEntry, "amount" | "unit" | "serving_label">) =>
  e.unit === "serving" ? `${+e.amount} × ${e.serving_label}` : `${+e.amount} ${e.unit}`;

export function EntryRow({ entry }: { entry: FoodEntry }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(entry.amount));
  const [unit, setUnit] = useState(entry.unit);
  const [meal, setMeal] = useState<Meal>(entry.meal);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      const r = await updateEntry({ id: entry.id, amount: Number(amount), unit, meal });
      if (r.ok) setOpen(false);
      else setError(r.error);
    });

  const remove = () => {
    if (!confirm(`Delete "${entry.food_name}"?`)) return;
    start(async () => {
      const r = await deleteEntry(entry.id);
      if (r.ok) setOpen(false);
      else setError(r.error);
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-surface-2" disabled={pending}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm">{entry.food_name}</span>
            <SourceBadge source={entry.source} confidence={entry.confidence} />
          </div>
          <div className="mt-0.5 truncate text-xs text-muted">
            {entry.brand ? `${entry.brand} · ` : ""}
            {unitLabel(entry)}
          </div>
        </div>
        <div className="shrink-0 text-right tabular">
          <div className="text-sm font-medium">{fmt(entry.calories)}</div>
          <div className="text-[11px] text-muted">
            <span className="text-protein">{fmt(entry.protein_g)}P</span> · <span className="text-carbs">{fmt(entry.carbs_g)}C</span> ·{" "}
            <span className="text-fat">{fmt(entry.fat_g)}F</span>
          </div>
        </div>
        <Pencil size={14} className="hidden shrink-0 text-faint group-hover:block" />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={entry.food_name}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
              <Input type="number" inputMode="decimal" step="any" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Unit">
              <Select value={unit} onChange={(e) => setUnit(e.target.value as FoodEntry["unit"])}>
                <option value="serving">{entry.serving_label}</option>
                {entry.serving_grams && <option value="g">grams</option>}
                {entry.serving_grams && <option value="oz">ounces</option>}
              </Select>
            </Field>
          </div>
          <Field label="Meal">
            <Select value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>
              {MEALS.map((m) => (
                <option key={m} value={m}>
                  {MEAL_LABEL[m]}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-xs text-muted">Nutrition is rescaled from the values saved when this was logged.</p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button variant="danger" onClick={remove} disabled={pending}>
              <Trash2 size={16} /> Delete
            </Button>
            <Button className="flex-1" onClick={save} disabled={pending || !(Number(amount) > 0)}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
