import type { Metadata } from "next";
import Link from "next/link";
import { Dumbbell, Footprints, Salad, Scale } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, Stat } from "@/components/ui/card";
import { MacroBar, Ring } from "@/components/ui/progress";
import { BarHistory } from "@/components/charts/bar-history";
import { WeightChart } from "@/components/charts/weight-chart";
import { AddFoodButton } from "@/components/nutrition/add-food-sheet";
import { getGoalForDate, getSession } from "@/lib/data";
import { addDays } from "@/lib/dates";
import { getBodySummary } from "@/lib/body/summary";
import { sumMacros } from "@/lib/nutrition/macros";
import { getDailyTotals, getEntries, getRecentFoods } from "@/lib/nutrition/queries";
import { STATUS_LABEL, GOAL_LABEL } from "@/lib/analytics/adaptive";
import { fmt } from "@/lib/utils";
import type { Meal } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Overview" };

function mealForNow(): Meal {
  const h = new Date().getHours();
  return h < 11 ? "breakfast" : h < 15 ? "lunch" : h < 21 ? "dinner" : "snack";
}

export default async function DashboardPage() {
  const { profile, today } = await getSession();
  const unit = profile.weight_unit;
  const goal = await getGoalForDate(today);
  const [entries, history, recent, body] = await Promise.all([
    getEntries(today),
    getDailyTotals(addDays(today, -6), today),
    getRecentFoods(),
    getBodySummary(today, unit, goal?.goal_type ?? "slight_surplus", goal?.calories ?? 2600, 30),
  ]);
  const t = sumMacros(entries);
  const byDate = new Map(history.map((h) => [h.date, h]));
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const cal7 = week.map((d) => ({ date: d, value: byDate.get(d)?.calories ?? 0 }));
  const pro7 = week.map((d) => ({ date: d, value: byDate.get(d)?.protein_g ?? 0 }));
  const remaining = (goal?.calories ?? 0) - t.calories;

  return (
    <>
      <Topbar title={`Hi${profile.display_name ? `, ${profile.display_name}` : ""}`}>
        <AddFoodButton date={today} meal={mealForNow()} recent={recent} variant="primary" label="Log food" />
      </Topbar>
      <div className="mx-auto grid max-w-6xl gap-4 p-4 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader
            title="Today"
            subtitle={goal ? `${GOAL_LABEL[goal.goal_type]} · ${fmt(goal.calories)} kcal` : undefined}
            action={<Link href="/nutrition" className="text-xs text-muted hover:text-fg">Diary →</Link>}
          />
          <div className="flex items-center gap-5">
            <Ring value={t.calories} max={goal?.calories ?? 0} size={124} stroke={11}>
              <div className="text-xl font-semibold tabular">{fmt(Math.abs(remaining))}</div>
              <div className="text-[10px] text-muted">{remaining >= 0 ? "left" : "over"}</div>
            </Ring>
            <div className="flex-1 space-y-3">
              <MacroBar label="Protein" value={t.protein_g} target={goal?.protein_g ?? 0} color="var(--color-protein)" />
              <MacroBar label="Carbs" value={t.carbs_g} target={goal?.carbs_g ?? 0} color="var(--color-carbs)" />
              <MacroBar label="Fat" value={t.fat_g} target={goal?.fat_g ?? 0} color="var(--color-fat)" />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Body" action={<Link href="/body" className="text-xs text-muted hover:text-fg">Details →</Link>} />
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Latest" value={fmt(body.latest?.value, 1)} unit={unit} />
            <Stat label="7-day avg" value={fmt(body.avg7, 1)} unit={unit} />
            <Stat label="Week" value={body.weekChange == null ? "—" : `${body.weekChange >= 0 ? "+" : ""}${body.weekChange.toFixed(1)}`} unit={unit} />
          </div>
          {body.chart.length > 1 && (
            <div className="mt-3">
              <WeightChart data={body.chart} unit={unit} height={120} />
            </div>
          )}
          <p className="mt-2 text-xs text-muted">
            {body.adaptive.status ? `Trend: ${STATUS_LABEL[body.adaptive.status]}. ` : ""}
            {body.adaptive.suggestedTarget ? "A calorie adjustment is suggested." : ""}
          </p>
        </Card>

        <Card>
          <CardHeader title="Training" subtitle="Workout logging arrives in phase 6" />
          <div className="grid grid-cols-3 gap-3 opacity-60">
            <Stat label="Workouts" value="—" hint="this week" />
            <Stat label="Work sets" value="—" />
            <Stat label="PRs" value="—" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Calories · 7 days" subtitle={`Target ${fmt(goal?.calories)} kcal`} />
          <BarHistory data={cal7} target={goal?.calories} color="var(--color-accent)" unit="kcal" />
        </Card>
        <Card>
          <CardHeader title="Protein · 7 days" subtitle={`Target ${fmt(goal?.protein_g)} g`} />
          <BarHistory data={pro7} target={goal?.protein_g} color="var(--color-protein)" unit="g" />
        </Card>

        <Card>
          <CardHeader title="Quick actions" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/nutrition", label: "Food diary", icon: Salad },
              { href: "/body", label: "Log weight", icon: Scale },
              { href: "/workouts", label: "Start workout", icon: Dumbbell },
              { href: "/analytics", label: "Add activity", icon: Footprints },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex flex-col items-start gap-2 rounded-xl bg-surface-2 p-3 text-sm hover:bg-surface-3">
                <Icon size={18} className="text-accent" />
                {label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
