import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Brain, Package, Server, Bot, PanelsTopLeft,
  ScrollText, Settings, ChevronDown, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/',              icon: LayoutDashboard, label: 'Overview' },
  { to: '/services',      icon: PanelsTopLeft,   label: 'Services',       dot: 'green' },
  { to: '/models',        icon: Brain,           label: 'AI Models',      badge: '5' },
  { to: '/docker',        icon: Package,         label: 'Docker',         dot: 'green' },
  { to: '/infrastructure',icon: Server,          label: 'Infrastructure' },
  { to: '/agents',        icon: Bot,             label: 'Agents',         badge: 'β' },
]

const SYSTEM_ITEMS = [
  { to: '/logs',     icon: ScrollText, label: 'Logs' },
  { to: '/settings', icon: Settings,   label: 'Settings' },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-[220px] min-w-[220px] bg-bg-surface border-r border-border-subtle flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-accent-purple rounded-md flex items-center justify-center flex-shrink-0 shadow-glow-purple">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary font-display">Homelab</div>
            <div className="text-2xs text-text-muted mono mt-0.5">homelab.local</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <div className="section-header">Main</div>
        {NAV_ITEMS.map(({ to, icon: Icon, label, badge, dot }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to}>
              <div className={cn(isActive ? 'nav-item-active' : 'nav-item')}>
                <Icon size={15} className={isActive ? 'text-[#A78BFA]' : 'text-text-muted'} />
                <span className="flex-1 text-sm">{label}</span>
                {dot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-status-green shadow-glow-green animate-blink" />
                )}
                {badge && (
                  <span className={cn(
                    'text-2xs px-1.5 py-0.5 rounded font-medium',
                    badge === 'β'
                      ? 'bg-status-amber-dim text-status-amber'
                      : 'bg-accent-purple-dim text-[#A78BFA]'
                  )}>
                    {badge}
                  </span>
                )}
              </div>
            </NavLink>
          )
        })}

        <div className="section-header">System</div>
        {SYSTEM_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to}>
              <div className={cn(isActive ? 'nav-item-active' : 'nav-item')}>
                <Icon size={15} className={isActive ? 'text-[#A78BFA]' : 'text-text-muted'} />
                <span className="flex-1 text-sm">{label}</span>
              </div>
            </NavLink>
          )
        })}
      </nav>

      {/* Server pill */}
      <div className="px-2 pb-3 pt-2 border-t border-border-subtle">
        <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md border border-border-default hover:border-border-strong hover:bg-bg-hover transition-all duration-150 group">
          <span className="w-1.5 h-1.5 rounded-full bg-status-green shadow-glow-green flex-shrink-0" />
          <div className="flex-1 text-left min-w-0">
            <div className="text-xs text-text-secondary truncate">ubuntu-home</div>
            <div className="text-2xs text-text-muted mono truncate">192.168.1.5</div>
          </div>
          <ChevronDown size={12} className="text-text-muted group-hover:text-text-tertiary flex-shrink-0" />
        </button>
      </div>
    </aside>
  )
}
