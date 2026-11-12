import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { DateNav } from "@/components/nutrition/date-nav";
import { DaySummary } from "@/components/nutrition/day-summary";
import { DayActions } from "@/components/nutrition/day-actions";
import { EntryRow } from "@/components/nutrition/entry-row";
import { AddFoodButton } from "@/components/nutrition/add-food-sheet";
import { getGoalForDate, getSession } from "@/lib/data";
import { isISODate } from "@/lib/dates";
import { sumMacros } from "@/lib/nutrition/macros";
import { getEntries, getRecentFoods } from "@/lib/nutrition/queries";
import { MEAL_LABEL, MEALS } from "@/lib/validation/schemas";
import { fmt } from "@/lib/utils";

export const metadata: Metadata = { title: "Nutrition" };

export default async function NutritionPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { today, supabase } = await getSession();
  const sp = await searchParams;
  const date = isISODate(sp.date) ? sp.date : today;

  const [entries, goal, recent, dayLog] = await Promise.all([
    getEntries(date),
    getGoalForDate(date),
    getRecentFoods(),
    supabase.from("day_logs").select("is_complete").eq("log_date", date).maybeSingle(),
  ]);
  const totals = sumMacros(entries);

  return (
    <>
      <Topbar title="Nutrition">
        <DateNav date={date} today={today} basePath="/nutrition" />
      </Topbar>
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <DaySummary totals={totals} goal={goal} />
        <DayActions date={date} complete={dayLog.data?.is_complete ?? false} hasEntries={entries.length > 0} />
        {MEALS.map((meal) => {
          const items = entries.filter((e) => e.meal === meal);
          const t = sumMacros(items);
          return (
            <Card key={meal} className="p-3 sm:p-4">
              <div className="mb-1 flex items-center justify-between px-2">
                <div>
                  <h2 className="text-sm font-medium">{MEAL_LABEL[meal]}</h2>
                  {items.length > 0 && (
                    <p className="text-xs text-muted tabular">
                      {fmt(t.calories)} kcal · {fmt(t.protein_g)}g protein
                    </p>
                  )}
                </div>
                <AddFoodButton date={date} meal={meal} recent={recent} />
              </div>
              {items.length > 0 ? (
                <div>{items.map((e) => <EntryRow key={e.id} entry={e} />)}</div>
              ) : (
                <p className="px-2 py-2 text-xs text-faint">Nothing logged</p>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
