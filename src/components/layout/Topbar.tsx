import { useLocation } from 'react-router-dom'
import { Search, Bell, RefreshCw, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROUTE_LABELS: Record<string, string> = {
  '/':               'Overview',
  '/models':         'AI Models',
  '/docker':         'Docker',
  '/infrastructure': 'Infrastructure',
  '/agents':         'Agents',
  '/logs':           'Logs',
  '/settings':       'Settings',
}

interface TopbarProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export default function Topbar({ onRefresh, isRefreshing }: TopbarProps) {
  const location = useLocation()
  const label = ROUTE_LABELS[location.pathname] ?? 'Homelab'

  return (
    <header className="h-12 bg-bg-base border-b border-border-subtle flex items-center px-5 gap-3 flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-text-muted">Homelab</span>
        <ChevronRight size={11} className="text-text-muted" />
        <span className="text-text-primary font-medium">{label}</span>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button className="icon-btn" title="Search">
          <Search size={13} />
        </button>
        <button className="icon-btn" title="Notifications">
          <Bell size={13} />
        </button>
        <button
          className={cn('icon-btn', isRefreshing && 'text-accent-purple border-accent-purple-dim')}
          onClick={onRefresh}
          title="Refresh"
        >
          <RefreshCw size={13} className={cn(isRefreshing && 'animate-spin')} />
        </button>

        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-accent-purple flex items-center justify-center text-white text-2xs font-medium flex-shrink-0 ml-1">
          HL
        </div>
      </div>
    </header>
  )
}