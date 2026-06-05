import { useSystemMetrics } from '@/hooks/useMetrics'
import { MetricCard, LoadingSpinner, PageHeader, StatusBadge } from '@/components/ui'
import { cpuColor, ramColor, diskColor } from '@/lib/utils'
import { Activity, Cpu, HardDrive, Network, Shield, Thermometer, Zap } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { useMemo } from 'react'

// Fake sparkline history
function useFakeHistory(baseValue: number, points = 20) {
  return useMemo(() => Array.from({ length: points }, (_, i) => ({
    t: i,
    v: Math.max(0, Math.min(100, baseValue + (Math.random() - 0.5) * 20)),
  })), [baseValue])
}

function MiniChart({ data, color }: { data: { t: number; v: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#g-${color})`} dot={false} isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0">
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className={`text-xs text-text-secondary ${mono ? 'mono' : ''}`}>{value}</span>
    </div>
  )
}

export default function OverviewPage() {
  const { data: metrics, isLoading, isError, error } = useSystemMetrics()
  const cpuUsage = metrics?.cpu ?? 0
  const ramUsage = metrics?.ram ?? 0
  const diskUsage = metrics?.disk ?? 0
  const cpuHistory  = useFakeHistory(cpuUsage || 24)
  const ramHistory  = useFakeHistory(ramUsage || 43)
  const gpuHistory  = useFakeHistory(0)
  const diskHistory = useFakeHistory(diskUsage || 58)

  if (isLoading) return <LoadingSpinner className="h-64" />

  if (isError || !metrics) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto animate-fade-in">
        <div className="card p-5 border-status-red/30">
          <div className="text-sm font-medium text-status-red">Unable to load system metrics</div>
          <div className="text-xs text-text-tertiary mt-1">
            {error instanceof Error ? error.message : 'Check that the FastAPI backend is running on port 8000.'}
          </div>
        </div>
      </div>
    )
  }

  const gpu = { usage: 0, temp: 0, model: 'Not implemented', vramUsed: 0, vramTotal: 0 }
  const network = { downloadMbps: 0, uploadMbps: 0, interface: 'Not implemented' }
  const tailscale = { ip: 'Not implemented', peers: 0, hostname: metrics.hostname }
  const os = 'Not implemented'
  const kernelVersion = 'Not implemented'

  return (
    <div className="p-6 max-w-screen-xl mx-auto animate-fade-in">
      <PageHeader
        title="Overview"
        subtitle={`${metrics.hostname} · Last updated just now`}
      >
        <button className="btn-primary">
          <Zap size={13} />
          Deploy
        </button>
      </PageHeader>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        <MetricCard
          label="CPU Usage"
          value={metrics.cpu.toFixed(0)}
          unit="%"
          sub="Live system metric"
          progress={metrics.cpu}
          progressColor={cpuColor(metrics.cpu)}
          statusLabel={metrics.cpu > 80 ? 'high' : 'healthy'}
          statusColor={metrics.cpu > 80 ? 'text-status-red' : 'text-status-green'}
        >
          <MiniChart data={cpuHistory} color="#6E56CF" />
        </MetricCard>

        <MetricCard
          label="RAM Usage"
          value={metrics.ram.toFixed(0)}
          unit="%"
          sub="Live system metric"
          progress={metrics.ram}
          progressColor={ramColor(metrics.ram)}
          statusLabel={metrics.ram > 80 ? 'high' : metrics.ram > 70 ? 'moderate' : 'healthy'}
          statusColor={metrics.ram > 80 ? 'text-status-red' : metrics.ram > 70 ? 'text-status-amber' : 'text-status-green'}
        >
          <MiniChart data={ramHistory} color="#F76B15" />
        </MetricCard>

        <MetricCard
          label="GPU Usage"
          value={gpu.usage.toFixed(0)}
          unit="%"
          sub={`${gpu.model} · VRAM ${gpu.vramUsed.toFixed(1)} / ${gpu.vramTotal} GB`}
          progress={gpu.usage}
          progressColor="bg-status-teal"
          statusLabel={gpu.usage > 5 ? 'active' : 'idle'}
          statusColor={gpu.usage > 5 ? 'text-status-teal' : 'text-text-muted'}
        >
          <MiniChart data={gpuHistory} color="#5CB8B2" />
        </MetricCard>

        {/* Disk */}
        <MetricCard
          label="Disk Usage"
          value={metrics.disk.toFixed(0)}
          unit="%"
          sub="Root filesystem"
          progress={metrics.disk}
          progressColor={diskColor(metrics.disk)}
        >
          <div className="flex items-center gap-4 text-xs text-text-tertiary mt-1">
            <span className="flex items-center gap-1"><span className="text-status-blue">↑</span> R — MB/s</span>
            <span className="flex items-center gap-1"><span className="text-status-amber">↓</span> W — MB/s</span>
          </div>
          <MiniChart data={diskHistory} color="#3B9EDE" />
        </MetricCard>

        {/* Network */}
        <div className="card p-4 flex flex-col gap-2">
          <div className="metric-label flex items-center gap-1.5">
            <Network size={11} />
            Network
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-medium text-text-primary font-display tracking-tight leading-none">
              {network.downloadMbps.toFixed(0)}
            </span>
            <span className="text-lg text-text-tertiary font-display">Mbps</span>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-status-blue">↓ {network.downloadMbps.toFixed(0)} Mbps</span>
            <span className="text-status-green">↑ {network.uploadMbps.toFixed(0)} Mbps</span>
          </div>
          <div className="text-xs text-text-muted">{network.interface} · 1 Gbps link</div>
        </div>

        {/* Tailscale */}
        <div className="card p-4 flex flex-col gap-2">
          <div className="metric-label flex items-center gap-1.5">
            <Shield size={11} />
            Tailscale
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status="stopped" label="Not implemented" />
          </div>
          <div className="text-xs text-text-secondary mono">{tailscale.ip}</div>
          <div className="text-xs text-text-tertiary">{tailscale.peers} peers · Phase 1 only</div>
          <div className="text-xs text-text-tertiary">{tailscale.hostname}.tailnet</div>
        </div>
      </div>

      {/* System info + temps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="metric-label mb-3 flex items-center gap-1.5">
            <Activity size={11} />
            System info
          </div>
          <InfoRow label="Hostname"      value={metrics.hostname}      mono />
          <InfoRow label="OS"            value={os}                 />
          <InfoRow label="Kernel"        value={kernelVersion}  mono />
          <InfoRow label="Uptime"        value={metrics.uptime} />
          <InfoRow label="Architecture"  value="x86_64"             />
        </div>

        <div className="card p-4">
          <div className="metric-label mb-3 flex items-center gap-1.5">
            <Thermometer size={11} />
            Temperatures
          </div>
          <div className="space-y-3">
            {[
              { label: 'CPU',  temp: 0,         max: 95 },
              { label: 'GPU',  temp: gpu.temp,  max: 90 },
              { label: 'Disk', temp: 38,         max: 70 },
            ].map(({ label, temp, max }) => {
              const pct = (temp / max) * 100
              const color = pct > 85 ? '#E5484D' : pct > 65 ? '#F76B15' : '#3DD68C'
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-tertiary">{label}</span>
                    <span className="text-xs font-medium mono" style={{ color }}>{temp.toFixed(0)}°C</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
