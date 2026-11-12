import { cn } from "@/lib/utils";

export function Progress({ value, max, color = "var(--color-accent)", className }: { value: number; max: number; color?: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = max > 0 && value > max * 1.05;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-3", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemax={Math.round(max)}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: over ? "var(--color-warn)" : color }} />
    </div>
  );
}

export function MacroBar({ label, value, target, color, unit = "g" }: { label: string; value: number; target: number; color: string; unit?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="tabular">
          <span className="font-medium text-fg">{Math.round(value)}</span>
          <span className="text-faint"> / {Math.round(target)}{unit}</span>
        </span>
      </div>
      <Progress value={value} max={target} color={color} />
    </div>
  );
}

export function Ring({ value, max, size = 140, stroke = 12, children }: { value: number; max: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const over = max > 0 && value > max * 1.05;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? "var(--color-warn)" : "var(--color-accent)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
