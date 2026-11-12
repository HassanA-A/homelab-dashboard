"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

const creds = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  next: z.string().startsWith("/").default("/dashboard"),
});

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = creds.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };
  redirect(parsed.data.next.startsWith("//") ? "/dashboard" : parsed.data.next);
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = creds.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: error.message };
  if (!data.session) return { message: "Check your email to confirm your account." };
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
