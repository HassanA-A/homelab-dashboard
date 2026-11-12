import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

const variants = {
  primary: "bg-accent text-black hover:bg-accent-strong font-semibold",
  secondary: "bg-surface-3 text-fg hover:bg-[#2c313a]",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  danger: "bg-danger/15 text-danger hover:bg-danger/25",
} as const;
const sizes = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-5 text-base", icon: "h-10 w-10" } as const;

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof variants; size?: keyof typeof sizes }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-accent",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
