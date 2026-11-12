"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteWeight } from "@/app/(app)/body/actions";
import { fromKg } from "@/lib/units";
import type { WeightEntry } from "@/types/db";

export function WeightList({ entries, unit }: { entries: WeightEntry[]; unit: "lb" | "kg" }) {
  const [pending, start] = useTransition();
  return (
    <ul className="divide-y divide-line">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
          <span className="text-muted">
            {new Date(`${e.local_date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}
            <span className="ml-2 text-xs text-faint">{new Date(e.measured_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
          </span>
          <span className="flex items-center gap-3">
            <span className="font-medium tabular">
              {fromKg(e.weight_kg, unit).toFixed(1)} {unit}
            </span>
            <button
              aria-label="Delete"
              disabled={pending}
              className="text-faint hover:text-danger"
              onClick={() => confirm("Delete this weigh-in?") && start(async () => void (await deleteWeight(e.id)))}
            >
              <Trash2 size={14} />
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}
