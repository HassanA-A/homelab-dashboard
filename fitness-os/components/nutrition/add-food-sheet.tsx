"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, PenLine, Plus, ScanBarcode, Search, Star, Zap } from "lucide-react";
import { quickAdd, toggleFavorite } from "@/app/(app)/nutrition/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { SourceBadge } from "@/components/ui/badge";
import { BarcodeScanner } from "./barcode-scanner";
import { ManualFoodForm } from "./manual-food-form";
import { PortionPicker } from "./portion-picker";
import { MEAL_LABEL, type Meal } from "@/lib/validation/schemas";
import type { FoodCandidate } from "@/lib/food-providers/types";
import { cn, fmt } from "@/lib/utils";

type Tab = "search" | "scan" | "recent" | "manual" | "quick";
const TABS: { id: Tab; label: string; icon: typeof Search }[] = [
  { id: "search", label: "Search", icon: Search },
  { id: "scan", label: "Scan", icon: ScanBarcode },
  { id: "recent", label: "Recent", icon: Clock },
  { id: "manual", label: "Manual", icon: PenLine },
  { id: "quick", label: "Quick", icon: Zap },
];

export interface LibraryFood extends FoodCandidate {
  food_id: string;
  is_favorite: boolean;
}

export function AddFoodButton({ date, meal, recent, variant = "ghost", label }: { date: string; meal: Meal; recent: LibraryFood[]; variant?: "ghost" | "primary"; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={label ? "md" : "sm"} onClick={() => setOpen(true)}>
        <Plus size={16} /> {label ?? "Add"}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={`Add to ${MEAL_LABEL[meal]}`}>
        <AddFoodFlow date={date} meal={meal} recent={recent} onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

function AddFoodFlow({ date, meal, recent, onDone }: { date: string; meal: Meal; recent: LibraryFood[]; onDone: () => void }) {
  const [tab, setTab] = useState<Tab>("search");
  const [picked, setPicked] = useState<FoodCandidate | null>(null);
  const [missingBarcode, setMissingBarcode] = useState<string | null>(null);

  if (picked) return <PortionPicker food={picked} date={date} meal={meal} onBack={() => setPicked(null)} onDone={onDone} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-1 rounded-xl bg-surface-2 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn("flex flex-col items-center gap-0.5 rounded-lg py-2 text-[11px]", tab === id ? "bg-surface-3 text-fg" : "text-muted")}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      {tab === "search" && <SearchTab onPick={setPicked} />}
      {tab === "scan" && (
        <ScanTab
          onPick={setPicked}
          onMissing={(code) => {
            setMissingBarcode(code);
            setTab("manual");
          }}
        />
      )}
      {tab === "recent" && <RecentTab foods={recent} onPick={setPicked} />}
      {tab === "manual" && <ManualFoodForm barcode={missingBarcode} onCreated={setPicked} />}
      {tab === "quick" && <QuickTab date={date} meal={meal} onDone={onDone} />}
    </div>
  );
}

function FoodList({ foods, onPick, favorites }: { foods: FoodCandidate[]; onPick: (f: FoodCandidate) => void; favorites?: boolean }) {
  const router = useRouter();
  const [, start] = useTransition();
  return (
    <ul className="-mx-2 max-h-[50dvh] divide-y divide-line overflow-y-auto">
      {foods.map((f) => (
        <li key={`${f.source}:${f.food_id ?? f.external_id ?? f.name}`} className="flex items-center">
          <button onClick={() => onPick(f)} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-surface-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm">{f.name}</span>
                <SourceBadge source={f.source} confidence={f.confidence} />
              </div>
              <div className="truncate text-xs text-muted">
                {f.brand ? `${f.brand} · ` : ""}
                {f.serving_label}
              </div>
            </div>
            <div className="shrink-0 text-right text-xs tabular">
              <div className="text-sm font-medium">{fmt(f.calories)}</div>
              <div className="text-muted">{fmt(f.protein_g)}g P</div>
            </div>
          </button>
          {favorites && f.food_id && (
            <button
              aria-label="Toggle favorite"
              className="p-2 text-faint hover:text-warn"
              onClick={() =>
                start(async () => {
                  await toggleFavorite(f.food_id!, !(f as LibraryFood).is_favorite);
                  router.refresh();
                })
              }
            >
              <Star size={16} className={(f as LibraryFood).is_favorite ? "fill-warn text-warn" : ""} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function SearchTab({ onPick }: { onPick: (f: FoodCandidate) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FoodCandidate[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search with cancellation so stale responses never overwrite newer ones.
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        const json = (await res.json()) as { results: FoodCandidate[]; errors: string[] };
        setResults(json.results ?? []);
        setErrors(json.errors ?? []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setErrors(["Search failed. Check your connection and try again."]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search foods or brands" className="pl-9" autoFocus />
        {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" />}
      </div>
      {errors.length > 0 && <p className="text-xs text-warn">{errors.join(" · ")}</p>}
      {results.length > 0 ? (
        <FoodList foods={results} onPick={onPick} />
      ) : (
        q.length >= 2 && !loading && <p className="py-6 text-center text-sm text-muted">No results. Try the Manual tab.</p>
      )}
    </div>
  );
}

function ScanTab({ onPick, onMissing }: { onPick: (f: FoodCandidate) => void; onMissing: (code: string) => void }) {
  const [state, setState] = useState<{ status: "scanning" } | { status: "looking"; code: string } | { status: "error"; code: string; message: string }>({ status: "scanning" });

  const lookup = async (code: string) => {
    setState({ status: "looking", code });
    try {
      const res = await fetch(`/api/barcode/${code}`);
      const json = (await res.json()) as { result: FoodCandidate | null; error?: string };
      if (json.result) onPick(json.result);
      else if (json.error) setState({ status: "error", code, message: json.error });
      else onMissing(code);
    } catch {
      setState({ status: "error", code, message: "Network error" });
    }
  };

  if (state.status === "looking")
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" /> Looking up {state.code}…
      </div>
    );
  if (state.status === "error")
    return (
      <div className="space-y-3 py-8 text-center">
        <p className="text-sm text-danger">Lookup failed: {state.message}</p>
        <div className="flex justify-center gap-2">
          <Button variant="secondary" onClick={() => lookup(state.code)}>Retry</Button>
          <Button variant="secondary" onClick={() => setState({ status: "scanning" })}>Scan again</Button>
          <Button onClick={() => onMissing(state.code)}>Enter manually</Button>
        </div>
      </div>
    );
  return <BarcodeScanner onDetected={lookup} />;
}

function RecentTab({ foods, onPick }: { foods: LibraryFood[]; onPick: (f: FoodCandidate) => void }) {
  const [onlyFav, setOnlyFav] = useState(false);
  const list = onlyFav ? foods.filter((f) => f.is_favorite) : foods;
  return (
    <div className="space-y-3">
      <div className="flex gap-2 text-xs">
        <button onClick={() => setOnlyFav(false)} className={cn("rounded-lg px-3 py-1.5", !onlyFav ? "bg-surface-3" : "text-muted")}>Recent</button>
        <button onClick={() => setOnlyFav(true)} className={cn("rounded-lg px-3 py-1.5", onlyFav ? "bg-surface-3" : "text-muted")}>Favorites</button>
      </div>
      {list.length ? <FoodList foods={list} onPick={onPick} favorites /> : <p className="py-6 text-center text-sm text-muted">Nothing here yet.</p>}
    </div>
  );
}

function QuickTab({ date, meal, onDone }: { date: string; meal: Meal; onDone: () => void }) {
  const [v, setV] = useState({ name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [requestId] = useState(() => crypto.randomUUID());
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });
  const num = { type: "number", inputMode: "decimal", step: "any", min: 0 } as const;
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await quickAdd({
            client_request_id: requestId,
            entry_date: date,
            meal,
            name: v.name || "Quick add",
            calories: Number(v.calories),
            protein_g: Number(v.protein_g) || 0,
            carbs_g: Number(v.carbs_g) || 0,
            fat_g: Number(v.fat_g) || 0,
          });
          if (r.ok) onDone();
          else setError(r.error);
        });
      }}
    >
      <p className="text-xs text-muted">For restaurant meals or when you only know the totals. Saved as an estimate.</p>
      <Field label="Description">
        <Input value={v.name} onChange={set("name")} placeholder="Quick add" />
      </Field>
      <div className="grid grid-cols-4 gap-2">
        <Field label="kcal"><Input {...num} value={v.calories} onChange={set("calories")} required /></Field>
        <Field label="Protein"><Input {...num} value={v.protein_g} onChange={set("protein_g")} /></Field>
        <Field label="Carbs"><Input {...num} value={v.carbs_g} onChange={set("carbs_g")} /></Field>
        <Field label="Fat"><Input {...num} value={v.fat_g} onChange={set("fat_g")} /></Field>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button size="lg" className="w-full" disabled={pending || v.calories === ""}>
        {pending ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
