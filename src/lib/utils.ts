import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cpuColor(pct: number): string {
  if (pct > 80) return 'bg-status-red'
  if (pct > 60) return 'bg-status-amber'
  return 'bg-accent-purple'
}

export function ramColor(pct: number): string {
  if (pct > 85) return 'bg-status-red'
  if (pct > 70) return 'bg-status-amber'
  return 'bg-status-blue'
}

export function diskColor(pct: number): string {
  if (pct > 90) return 'bg-status-red'
  if (pct > 75) return 'bg-status-amber'
  return 'bg-status-teal'
}

export function statusColor(pct: number): string {
  if (pct > 80) return 'text-status-red'
  if (pct > 60) return 'text-status-amber'
  return 'text-text-primary'
}