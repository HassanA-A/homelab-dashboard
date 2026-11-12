"use client";

import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const weekday = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" });

export function BarHistory({ data, target, color, unit, height = 140 }: { data: { date: string; value: number }[]; target?: number; color: string; unit: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <XAxis dataKey="date" tickFormatter={weekday} tick={{ fill: "#8b919c", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
          contentStyle={{ background: "#1a1d23", border: "1px solid #262a32", borderRadius: 12, fontSize: 12 }}
          labelFormatter={(d) => weekday(String(d))}
          formatter={(v) => [`${Math.round(Number(v))} ${unit}`, ""]}
        />
        {target ? <ReferenceLine y={target} stroke="#5b616b" strokeDasharray="4 4" /> : null}
        <Bar dataKey="value" radius={[6, 6, 2, 2]}>
          {data.map((d) => (
            <Cell key={d.date} fill={d.value === 0 ? "#23272f" : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
