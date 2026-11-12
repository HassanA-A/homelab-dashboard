"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandIcon, NAV } from "./nav";

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-bg px-3 py-5 lg:flex">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
          <BrandIcon size={18} />
        </span>
        <span className="font-semibold tracking-tight">Fitness OS</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface hover:text-fg",
              )}
            >
              <Icon size={18} className={active ? "text-accent" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function BottomNav() {
  const path = usePathname();
  const items = NAV.filter((n) => n.href !== "/settings");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {items.map((n) => {
        const active = path.startsWith(n.href);
        const Icon = n.icon;
        return (
          <Link key={n.href} href={n.href} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px]", active ? "text-accent" : "text-muted")}>
            <Icon size={22} />
            {"short" in n ? n.short : n.label}
          </Link>
        );
      })}
    </nav>
  );
}
