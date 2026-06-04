import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className="h-5 w-5 animate-spin text-accent-purple" />
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-2xl font-medium text-text-primary font-display">{title}</h1>
        {subtitle && <p className="text-xs text-text-tertiary mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  unit,
  sub,
  progress,
  progressColor,
  statusLabel,
  statusColor,
  children,
}: {
  label: string
  value: string
  unit?: string
  sub?: string
  progress?: number
  progressColor?: string
  statusLabel?: string
  statusColor?: string
  children?: ReactNode
}) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="metric-label">{label}</div>
        {statusLabel && <span className={cn('text-2xs uppercase font-medium', statusColor)}>{statusLabel}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-medium text-text-primary font-display tracking-tight leading-none">{value}</span>
        {unit && <span className="text-lg text-text-tertiary font-display">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-text-muted truncate">{sub}</div>}
      {typeof progress === 'number' && (
        <div className="progress-bar mt-1">
          <div className={cn('progress-fill', progressColor)} style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
      {children}
    </div>
  )
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const color =
    status === 'running' || status === 'synced' || status === 'connected'
      ? 'badge-green'
      : status === 'error'
        ? 'badge-red'
        : status === 'stopped'
          ? 'badge-gray'
          : 'badge-amber'

  return <span className={cn('badge', color)}>{label ?? status}</span>
}

export function StatusDot({ status }: { status: string }) {
  const color =
    status === 'running' || status === 'ready'
      ? 'bg-status-green shadow-glow-green'
      : status === 'error'
        ? 'bg-status-red'
        : 'bg-text-muted'

  return <span className={cn('status-dot', color)} />
}

export function QuantBadge({ quant }: { quant: string }) {
  const color = quant.includes('Q4') ? 'badge-purple' : quant.includes('Q8') ? 'badge-blue' : 'badge-amber'
  return <span className={cn('badge', color)}>{quant}</span>
}
