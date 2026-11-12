import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { lookupBarcode } from "@/lib/food-providers/openfoodfacts";

// GET /api/barcode/0123456789012 — library first, then Open Food Facts.
// Returns { result: null } when not found; the client offers manual entry. Never guesses.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^\d{6,14}$/.test(code)) return NextResponse.json({ error: "Invalid barcode" }, { status: 400 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: mine } = await supabase
    .from("foods")
    .select("id, source, external_id, barcode, name, brand, serving_label, serving_grams, calories, protein_g, carbs_g, fat_g, fiber_g, confidence")
    .eq("barcode", code)
    .is("archived_at", null)
    .limit(1)
    .maybeSingle();
  if (mine) return NextResponse.json({ result: { ...mine, food_id: mine.id } });

  try {
    const result = await lookupBarcode(code, AbortSignal.timeout(8000));
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ result: null, error: e instanceof Error ? e.message : "Lookup failed" }, { status: 502 });
  }
}
