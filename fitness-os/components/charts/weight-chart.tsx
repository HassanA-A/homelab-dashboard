"use client";

import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";

export interface WeightPoint {
  date: string;
  scale: number | null;
  trend: number;
}

const short = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });

export function WeightChart({ data, unit, height = 240 }: { data: WeightPoint[]; unit: string; height?: number }) {
  const vals = data.flatMap((d) => [d.trend, d.scale ?? d.trend]);
  const min = Math.floor(Math.min(...vals) - 1);
  const max = Math.ceil(Math.max(...vals) + 1);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke="#262a32" vertical={false} />
        <XAxis dataKey="date" tickFormatter={short} tick={{ fill: "#8b919c", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis domain={[min, max]} tick={{ fill: "#8b919c", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#1a1d23", border: "1px solid #262a32", borderRadius: 12, fontSize: 12 }}
          labelFormatter={(d) => short(String(d))}
          formatter={(v, name) => [`${Number(v).toFixed(1)} ${unit}`, name === "trend" ? "Trend" : "Scale"]}
        />
        <Scatter dataKey="scale" fill="#5b616b" />
        <Line type="monotone" dataKey="trend" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
