"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { saveGoal } from "@/app/(app)/body/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, Stat } from "@/components/ui/card";
import { STATUS_LABEL, type AdaptiveResult } from "@/lib/analytics/adaptive";
import { reconcileCarbs } from "@/lib/nutrition/macros";
import { fmt } from "@/lib/utils";
import type { NutritionGoal } from "@/types/db";

const confTone = { insufficient: "gray", low: "amber", medium: "blue", high: "green" } as const;

/** Shows the recommendation; the user must explicitly accept before targets change. */
export function AdaptiveCard({ result, goal, today }: { result: AdaptiveResult; goal: NutritionGoal | null; today: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const accept = () => {
    if (!goal || !result.suggestedTarget) return;
    const carbs = reconcileCarbs(result.suggestedTarget, goal.protein_g, goal.fat_g);
    if (carbs == null) return setMsg("Protein and fat already exceed the suggested calories — adjust in Settings.");
    if (!confirm(`Change daily target from ${goal.calories} to ${result.suggestedTarget} kcal starting today? (Carbs → ${carbs}g; protein and fat unchanged.)`)) return;
    start(async () => {
      const r = await saveGoal({
        goal_type: goal.goal_type,
        calories: result.suggestedTarget!,
        protein_g: goal.protein_g,
        fat_g: goal.fat_g,
        carbs_g: carbs,
        fiber_g: goal.fiber_g ?? undefined,
        effective_date: today,
        source: "recommendation",
      });
      setMsg(r.ok ? "Target updated." : r.error);
    });
  };

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent" /> Calorie recommendation
          </span>
        }
        subtitle={`Last ${result.windowDays} days · ${result.weighInDays} weigh-in days · ${result.completeIntakeDays} complete log days`}
        action={<Badge tone={confTone[result.confidence]}>{result.confidence === "insufficient" ? "Need data" : `${result.confidence} confidence`}</Badge>}
      />
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Trend" value={result.status ? STATUS_LABEL[result.status] : "—"} className="[&>div:nth-child(2)]:text-base" />
        <Stat label="Rate" value={result.rateLbPerWeek == null ? "—" : `${result.rateLbPerWeek >= 0 ? "+" : ""}${result.rateLbPerWeek.toFixed(2)}`} unit="lb/wk" />
        <Stat label="Est. maintenance" value={fmt(result.estimatedMaintenance)} unit="kcal" />
      </div>
      <p className="text-sm text-muted">{result.message}</p>
      {result.reasons.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-faint">
          {result.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      {result.suggestedTarget && (
        <Button className="mt-4" onClick={accept} disabled={pending}>
          {pending ? "Saving…" : `Apply ${result.suggestedTarget} kcal`}
        </Button>
      )}
      {msg && <p className="mt-2 text-xs text-accent">{msg}</p>}
    </Card>
  );
}
