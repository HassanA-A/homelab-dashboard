import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const round = (n: number, dp = 0) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

export const fmt = (n: number | null | undefined, dp = 0) =>
  n == null || Number.isNaN(n) ? "—" : round(n, dp).toLocaleString(undefined, { maximumFractionDigits: dp, minimumFractionDigits: dp });
