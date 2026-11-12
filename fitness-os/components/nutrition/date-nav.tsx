import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatDayLabel } from "@/lib/dates";

export function DateNav({ date, today, basePath }: { date: string; today: string; basePath: string }) {
  const href = (d: string) => (d === today ? basePath : `${basePath}?date=${d}`);
  return (
    <div className="flex items-center gap-1 rounded-xl bg-surface p-1 ring-1 ring-line">
      <Link href={href(addDays(date, -1))} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Previous day">
        <ChevronLeft size={18} />
      </Link>
      <Link href={basePath} className="min-w-24 text-center text-sm font-medium">
        {formatDayLabel(date, today)}
      </Link>
      <Link href={href(addDays(date, 1))} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Next day">
        <ChevronRight size={18} />
      </Link>
    </div>
  );
}
