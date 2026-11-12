import { Card } from "@/components/ui/card";
import { MacroBar, Ring } from "@/components/ui/progress";
import { fmt } from "@/lib/utils";
import type { Macros } from "@/lib/nutrition/macros";
import type { NutritionGoal } from "@/types/db";

export function DaySummary({ totals, goal }: { totals: Required<Macros>; goal: NutritionGoal | null }) {
  const target = goal?.calories ?? 0;
  const remaining = target - totals.calories;
  return (
    <Card className="flex flex-col items-center gap-6 sm:flex-row">
      <Ring value={totals.calories} max={target}>
        <div className="text-2xl font-semibold tabular">{fmt(Math.abs(remaining))}</div>
        <div className="text-[11px] text-muted">{remaining >= 0 ? "kcal left" : "kcal over"}</div>
      </Ring>
      <div className="w-full flex-1 space-y-3">
        <div className="flex justify-between text-xs text-muted">
          <span>
            <span className="text-base font-semibold text-fg tabular">{fmt(totals.calories)}</span> / {fmt(target)} kcal
          </span>
          {(totals.fiber_g ?? 0) > 0 && <span className="tabular">Fiber {fmt(totals.fiber_g)}g</span>}
        </div>
        <MacroBar label="Protein" value={totals.protein_g} target={goal?.protein_g ?? 0} color="var(--color-protein)" />
        <MacroBar label="Carbs" value={totals.carbs_g} target={goal?.carbs_g ?? 0} color="var(--color-carbs)" />
        <MacroBar label="Fat" value={totals.fat_g} target={goal?.fat_g ?? 0} color="var(--color-fat)" />
      </div>
    </Card>
  );
}
