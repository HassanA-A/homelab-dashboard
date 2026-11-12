"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/schemas";

export type ProfileState = { ok?: boolean; error?: string };

export async function saveProfile(_: ProfileState, form: FormData): Promise<ProfileState> {
  const p = profileSchema.safeParse(Object.fromEntries(form));
  if (!p.success) return { error: p.error.issues[0]?.message };
  try {
    new Intl.DateTimeFormat("en", { timeZone: p.data.timezone });
  } catch {
    return { error: "Unknown timezone" };
  }
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ ...p.data, height_cm: p.data.height_cm === "" || p.data.height_cm == null ? null : p.data.height_cm })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
