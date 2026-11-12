import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, Stat } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { WeightChart } from "@/components/charts/weight-chart";
import { WeightForm } from "@/components/body/weight-form";
import { WeightList } from "@/components/body/weight-list";
import { AdaptiveCard } from "@/components/body/adaptive-card";
import { getGoalForDate, getSession } from "@/lib/data";
import { getBodySummary } from "@/lib/body/summary";
import { fmt } from "@/lib/utils";

export const metadata: Metadata = { title: "Weight & Body" };

export default async function BodyPage() {
  const { profile, today } = await getSession();
  const unit = profile.weight_unit;
  const goal = await getGoalForDate(today);
  const s = await getBodySummary(today, unit, goal?.goal_type ?? "slight_surplus", goal?.calories ?? 2600);

  return (
    <>
      <Topbar title="Weight & Body" />
      <div className="mx-auto grid max-w-6xl gap-4 p-4 sm:p-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Weight trend" subtitle="Dots are daily weigh-ins; the line is the smoothed trend. Single weigh-ins are mostly water." />
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Latest" value={fmt(s.latest?.value, 1)} unit={unit} />
            <Stat label="7-day avg" value={fmt(s.avg7, 1)} unit={unit} />
            <Stat label="Trend" value={fmt(s.trend, 1)} unit={unit} />
            <Stat
              label="Trend, 7 days"
              value={s.weekChange == null ? "—" : `${s.weekChange >= 0 ? "+" : ""}${s.weekChange.toFixed(2)}`}
              unit={unit}
            />
          </div>
          {s.chart.length > 1 ? (
            <WeightChart data={s.chart} unit={unit} height={280} />
          ) : (
            <Empty icon={Scale} title="No trend yet">Log a few weigh-ins to see your trend.</Empty>
          )}
        </Card>
        <Card>
          <CardHeader title="Log weight" />
          <WeightForm unit={unit} today={today} />
        </Card>
        <div className="lg:col-span-2">
          <AdaptiveCard result={s.adaptive} goal={goal} today={today} />
        </div>
        <Card>
          <CardHeader title="History" />
          {s.weights.length ? <WeightList entries={s.weights.slice(0, 30)} unit={unit} /> : <p className="text-sm text-muted">No weigh-ins yet.</p>}
        </Card>
      </div>
    </>
  );
}
