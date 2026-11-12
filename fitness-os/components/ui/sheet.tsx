"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/** Bottom sheet on mobile, centered dialog on desktop. Uses native <dialog> for focus trapping + Esc. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 mt-auto w-full max-w-none max-h-[92dvh] rounded-t-3xl bg-surface p-0 text-fg ring-1 ring-line sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Close">
          <X size={18} />
        </button>
      </div>
      <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{open && children}</div>
    </dialog>
  );
}
