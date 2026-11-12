import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl bg-surface-2 px-3 text-base sm:text-sm text-fg placeholder:text-faint ring-1 ring-line outline-none focus:ring-accent/70 transition",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn("h-11 w-full rounded-xl bg-surface-2 px-3 text-base sm:text-sm text-fg ring-1 ring-line outline-none focus:ring-accent/70", className)}
      {...props}
    />
  );
}

export function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}
