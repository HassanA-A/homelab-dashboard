import { useState } from 'react'
import { useContainers, useToggleContainer } from '@/hooks/useMetrics'
import { LoadingSpinner, PageHeader, StatusBadge } from '@/components/ui'
import { formatUptime, type Container } from '@/data/mock'
import { Play, Square, RefreshCw, FileText, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type FilterTab = 'all' | 'running' | 'stopped'

function CpuBar({ pct }: { pct: number }) {
  const color = pct > 30 ? '#F76B15' : pct > 15 ? '#F76B15' : '#6E56CF'
  const textColor = pct > 30 ? 'text-status-amber' : 'text-text-tertiary'
  return (
    <div className="min-w-[100px]">
      <div className={cn('text-2xs mb-1 flex justify-between mono', textColor)}>
        <span>CPU</span>
        <span>{pct > 0 ? pct.toFixed(1) : '—'}%</span>
      </div>
      <div className="h-[3px] bg-bg-active rounded-full overflow-hidden w-24">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function PortBadges({ ports }: { ports: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {ports.slice(0, 2).map(p => (
        <span key={p} className="badge badge-blue mono">{p.split(':')[0]}</span>
      ))}
      {ports.length > 2 && (
        <span className="badge badge-gray">+{ports.length - 2}</span>
      )}
    </div>
  )
}

function ContainerRow({ container }: { container: Container }) {
  const toggle = useToggleContainer()
  const isRunning = container.status === 'running'
  const isRestarting = container.status === 'restarting'

  return (
    <div className={cn(
      'flex items-center gap-4 px-4 py-3 border-b border-border-subtle last:border-0 hover:bg-bg-card transition-colors duration-100 group',
      !isRunning && 'opacity-60 hover:opacity-80'
    )}>
      {/* Status + Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          isRunning ? 'bg-status-green shadow-glow-green' : 'bg-text-muted',
          isRestarting && 'bg-status-amber animate-pulse-slow'
        )} />
        <div className="min-w-0">
          <div className="text-sm font-medium text-text-primary mono">{container.name}</div>
          <div className="text-xs text-text-muted truncate max-w-[200px]">{container.image}</div>
        </div>
      </div>

      {/* CPU */}
      <div className="hidden sm:block">
        <CpuBar pct={container.cpuPercent} />
      </div>

      {/* Memory */}
      <div className="hidden lg:block text-xs mono text-text-tertiary min-w-[80px]">
        {isRunning ? `${(container.memUsedMB / 1024).toFixed(1)} GB` : '—'}
      </div>

      {/* Ports */}
      <div className="hidden md:block min-w-[100px]">
        <PortBadges ports={container.ports} />
      </div>

      {/* Uptime */}
      <div className="text-xs text-text-tertiary min-w-[60px] text-right">
        {container.uptime ? formatUptime(container.uptime) : 'Stopped'}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {isRunning ? (
          <button
            className="icon-btn"
            title="Stop"
            onClick={() => toggle.mutate({ id: container.id, action: 'stop' })}
          >
            <Square size={11} />
          </button>
        ) : (
          <button
            className="icon-btn-success"
            title="Start"
            onClick={() => toggle.mutate({ id: container.id, action: 'start' })}
          >
            <Play size={11} />
          </button>
        )}
        <button
          className="icon-btn"
          title="Restart"
          onClick={() => toggle.mutate({ id: container.id, action: 'restart' })}
        >
          <RefreshCw size={11} className={toggle.isPending ? 'animate-spin' : ''} />
        </button>
        <button className="icon-btn" title="Logs">
          <FileText size={11} />
        </button>
      </div>
    </div>
  )
}

export default function DockerPage() {
  const { data: containers, isLoading } = useContainers()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')

  if (isLoading || !containers) return <LoadingSpinner className="h-64" />

  const running = containers.filter(c => c.status === 'running')
  const stopped = containers.filter(c => c.status === 'stopped')
  const totalCpu = running.reduce((s, c) => s + c.cpuPercent, 0)
  const totalMem = running.reduce((s, c) => s + c.memUsedMB, 0)

  const filtered = containers
    .filter(c => filter === 'all' ? true : filter === 'running' ? c.status === 'running' : c.status === 'stopped')
    .filter(c => search === '' || `${c.name} ${c.image}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 max-w-screen-xl mx-auto animate-fade-in">
      <PageHeader
        title="Docker"
        subtitle={`Docker Engine 24.0.7 · ${containers.length} containers`}
      >
        <button className="btn-ghost text-xs">
          <RefreshCw size={12} /> Refresh
        </button>
        <button className="btn-primary text-xs">
          <Plus size={12} /> Run Container
        </button>
      </PageHeader>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: `${running.length} running`, color: 'bg-status-green-dim text-status-green border-status-green/20' },
          { label: `${stopped.length} stopped`, color: 'bg-bg-active text-text-muted border-border-default' },
          { label: `CPU ${totalCpu.toFixed(1)}%`,   color: 'bg-bg-raised text-text-secondary border-border-default' },
          { label: `Mem ${(totalMem / 1024).toFixed(1)} GB`, color: 'bg-bg-raised text-text-secondary border-border-default' },
        ].map(({ label, color }) => (
          <div key={label} className={cn('text-xs px-3 py-1.5 rounded-md border mono', color)}>
            {label}
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-0.5 bg-bg-raised border border-border-default rounded-md p-0.5">
          {(['all', 'running', 'stopped'] as FilterTab[]).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                'px-3 py-1 rounded text-xs font-medium transition-colors capitalize',
                filter === t
                  ? 'bg-bg-hover text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-2 bg-bg-raised border border-border-default rounded-md px-3 py-1.5">
          <Search size={12} className="text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter containers…"
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
      </div>

      {/* Container table */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border-subtle">
          <div className="flex-1 table-head pl-5">Container</div>
          <div className="hidden sm:block table-head min-w-[120px]">CPU</div>
          <div className="hidden lg:block table-head min-w-[80px]">Memory</div>
          <div className="hidden md:block table-head min-w-[100px]">Ports</div>
          <div className="table-head min-w-[60px] text-right">Uptime</div>
          <div className="table-head w-[88px] text-right">Actions</div>
        </div>

        {filtered.map(c => <ContainerRow key={c.id} container={c} />)}

        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-text-muted">No containers match your filter.</div>
        )}
      </div>
    </div>
  )
}