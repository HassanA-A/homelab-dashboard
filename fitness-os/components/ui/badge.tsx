import { cn } from "@/lib/utils";

const tones = {
  green: "bg-accent/10 text-accent",
  blue: "bg-protein/10 text-protein",
  purple: "bg-fat/10 text-fat",
  amber: "bg-warn/10 text-warn",
  gray: "bg-surface-3 text-muted",
} as const;

export function Badge({ tone = "gray", children, className }: { tone?: keyof typeof tones; children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide", tones[tone], className)}>{children}</span>;
}

export function SourceBadge({ source, confidence }: { source: string; confidence: string }) {
  const label = { usda: "USDA", off: "OFF", custom: "Custom", recipe: "Recipe", quick: "Quick" }[source] ?? source;
  const tone = confidence === "verified" ? "green" : confidence === "estimated" ? "amber" : "blue";
  return (
    <Badge tone={tone} className="shrink-0">
      {label}
      {confidence === "estimated" && " · est"}
    </Badge>
  );
}
