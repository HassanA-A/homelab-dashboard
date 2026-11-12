import type { LucideIcon } from "lucide-react";

export function Empty({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <Icon className="mb-3 text-faint" size={28} />
      <p className="text-sm font-medium">{title}</p>
      {children && <div className="mt-1 text-xs text-muted">{children}</div>}
    </div>
  );
}
