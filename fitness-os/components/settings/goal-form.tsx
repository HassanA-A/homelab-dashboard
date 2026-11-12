"use client";

import { useState, useTransition } from "react";
import { saveGoal } from "@/app/(app)/body/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { GOAL_LABEL, GOAL_RATE_LB_PER_WEEK, type GoalType } from "@/lib/analytics/adaptive";
import { caloriesFromMacros, reconcileCarbs } from "@/lib/nutrition/macros";
import type { NutritionGoal } from "@/types/db";

export function GoalForm({ goal, today, bodyweightLb }: { goal: NutritionGoal | null; today: string; bodyweightLb: number | null }) {
  const [v, setV] = useState({
    goal_type: (goal?.goal_type ?? "slight_surplus") as GoalType,
    calories: String(goal?.calories ?? 2600),
    protein_g: String(goal?.protein_g ?? 140),
    fat_g: String(goal?.fat_g ?? 75),
    fiber_g: String(goal?.fiber_g ?? 30),
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });

  const cal = Number(v.calories);
  const p = Number(v.protein_g);
  const f = Number(v.fat_g);
  const carbs = reconcileCarbs(cal, p, f);
  const [lo, hi] = GOAL_RATE_LB_PER_WEEK[v.goal_type];
  const pPerLb = bodyweightLb ? p / bodyweightLb : null;
  const fatPct = cal ? (f * 9) / cal : 0;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (carbs == null) return;
        start(async () => {
          const r = await saveGoal({ goal_type: v.goal_type, calories: cal, protein_g: p, fat_g: f, carbs_g: carbs, fiber_g: Number(v.fiber_g) || undefined, effective_date: today, source: "manual" });
          setMsg(r.ok ? { ok: true, text: "Saved. Past days keep the targets that applied then." } : { ok: false, text: r.error });
        });
      }}
    >
      <Field label="Goal">
        <Select value={v.goal_type} onChange={set("goal_type")}>
          {(Object.keys(GOAL_LABEL) as GoalType[]).map((g) => (
            <option key={g} value={g}>
              {GOAL_LABEL[g]} ({GOAL_RATE_LB_PER_WEEK[g][0]} to {GOAL_RATE_LB_PER_WEEK[g][1]} lb/wk)
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Calories">
          <Input type="number" inputMode="numeric" value={v.calories} onChange={set("calories")} />
        </Field>
        <Field label="Protein (g)">
          <Input type="number" inputMode="numeric" value={v.protein_g} onChange={set("protein_g")} />
        </Field>
        <Field label="Fat (g)">
          <Input type="number" inputMode="numeric" value={v.fat_g} onChange={set("fat_g")} />
        </Field>
        <Field label="Carbs (g) — auto">
          <Input value={carbs ?? "—"} readOnly className="text-muted" />
        </Field>
      </div>
      <Field label="Fiber target (g)">
        <Input type="number" inputMode="numeric" value={v.fiber_g} onChange={set("fiber_g")} className="max-w-32" />
      </Field>
      <div className="space-y-1 rounded-xl bg-surface-2 p-3 text-xs text-muted">
        <p>Carbs fill the remaining calories, so macros always add up ({carbs == null ? "protein + fat exceed calories" : `${Math.round(caloriesFromMacros({ protein_g: p, carbs_g: carbs, fat_g: f }))} kcal`}).</p>
        {pPerLb != null && <p>Protein = {pPerLb.toFixed(2)} g/lb bodyweight{pPerLb < 0.7 ? " — consider ≥0.7 g/lb for muscle gain." : "."}</p>}
        {fatPct < 0.2 && <p className="text-warn">Fat is under 20% of calories.</p>}
        <p>Target pace: {lo} to {hi} lb/week. Exercise calories are not added back.</p>
      </div>
      {msg && <p className={msg.ok ? "text-sm text-accent" : "text-sm text-danger"}>{msg.text}</p>}
      <Button disabled={pending || carbs == null}>{pending ? "Saving…" : "Save targets from today"}</Button>
    </form>
  );
}
