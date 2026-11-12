import Link from "next/link";
import { Settings } from "lucide-react";

export function Topbar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur sm:px-6">
      <h1 className="truncate text-base font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        {children}
        <Link href="/settings" className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg lg:hidden" aria-label="Settings">
          <Settings size={18} />
        </Link>
      </div>
    </header>
  );
}
