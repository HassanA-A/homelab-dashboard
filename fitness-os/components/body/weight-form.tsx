"use client";

import { useState, useTransition } from "react";
import { logWeight } from "@/app/(app)/body/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WeightForm({ unit, today }: { unit: "lb" | "kg"; today: string }) {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const r = await logWeight({
            client_request_id: requestId,
            weight: Number(weight),
            unit,
            local_date: date,
            measured_at: date === today ? new Date().toISOString() : new Date(`${date}T08:00:00`).toISOString(),
          });
          if (!r.ok) return setError(r.error);
          setWeight("");
          setRequestId(crypto.randomUUID());
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        });
      }}
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input type="number" inputMode="decimal" step="0.1" min="0" placeholder="Weight" value={weight} onChange={(e) => setWeight(e.target.value)} className="pr-10 text-lg" required />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{unit}</span>
        </div>
        <Input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className="w-40" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button className="w-full" disabled={pending || !weight}>
        {pending ? "Saving…" : saved ? "Saved ✓" : "Log weight"}
      </Button>
      <p className="text-xs text-muted">Weigh in the morning after the bathroom, before eating. Multiple weigh-ins per day are averaged.</p>
    </form>
  );
}
