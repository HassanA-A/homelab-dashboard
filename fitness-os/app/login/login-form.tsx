"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { signIn, signUp, type AuthState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "in" ? signIn : signUp, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} minLength={8} required />
      </Field>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.message && <p className="text-sm text-accent">{state.message}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "…" : mode === "in" ? "Sign in" : "Create account"}
      </Button>
      <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-center text-sm text-muted hover:text-fg">
        {mode === "in" ? "No account? Create one" : "Have an account? Sign in"}
      </button>
    </form>
  );
}
