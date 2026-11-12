import type { Metadata } from "next";
import { BrandIcon } from "@/components/layout/nav";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-surface p-8 ring-1 ring-line">
        <div className="mb-8 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15 text-accent">
            <BrandIcon size={20} />
          </span>
          <div>
            <div className="font-semibold">Fitness OS</div>
            <div className="text-xs text-muted">Nutrition · Strength · Body</div>
          </div>
        </div>
        <LoginForm next={next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"} />
      </div>
    </div>
  );
}
