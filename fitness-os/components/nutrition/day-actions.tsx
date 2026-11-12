"use client";

import { useTransition } from "react";
import { CheckCircle2, Circle, Copy } from "lucide-react";
import { copyMeal, setDayComplete } from "@/app/(app)/nutrition/actions";
import { Button } from "@/components/ui/button";
import { addDays } from "@/lib/dates";

export function DayActions({ date, complete, hasEntries }: { date: string; complete: boolean; hasEntries: boolean }) {
  const [pending, start] = useTransition();
  const copyYesterday = () => {
    if (hasEntries && !confirm("This day already has entries. Add yesterday's foods on top?")) return;
    start(async () => {
      const r = await copyMeal({ from: addDays(date, -1), to: date });
      if (r.ok && r.data === 0) alert("Yesterday has no entries to copy.");
      else if (!r.ok) alert(r.error);
    });
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant={complete ? "secondary" : "ghost"} size="sm" disabled={pending} onClick={() => start(async () => void (await setDayComplete(date, !complete)))}>
        {complete ? <CheckCircle2 size={16} className="text-accent" /> : <Circle size={16} />}
        {complete ? "Day complete" : "Mark day complete"}
      </Button>
      <Button variant="ghost" size="sm" disabled={pending} onClick={copyYesterday}>
        <Copy size={16} /> Copy yesterday
      </Button>
    </div>
  );
}
