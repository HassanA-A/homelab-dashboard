import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-[var(--radius-card)] bg-surface p-4 sm:p-5 ring-1 ring-white/[0.04]", className)} {...props} />;
}

export function CardHeader({ title, action, subtitle }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-medium text-fg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, unit, hint, className }: { label: string; value: ReactNode; unit?: string; hint?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted">{unit}</span>}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}
