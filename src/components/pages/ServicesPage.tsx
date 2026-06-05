import { ExternalLink, FileText, RefreshCw, RotateCw, Server } from 'lucide-react'
import { useState } from 'react'
import { LoadingSpinner, PageHeader } from '@/components/ui'
import { useOpenWebuiLogs, useRestartOpenWebui, useServices } from '@/hooks/useServices'
import type { HomelabService } from '@/services/servicesApi'
import { cn } from '@/lib/utils'

function statusBadgeClass(status: string) {
  if (status === 'healthy' || status === 'running') return 'badge-green'
  if (status === 'restarting') return 'badge-amber'
  if (status === 'offline' || status === 'missing') return 'badge-red'
  return 'badge-gray'
}

function openService(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function QuickAccess({ services }: { services: HomelabService[] }) {
  const openWebui = services.find(service => service.id === 'open-webui')
  const ollama = services.find(service => service.id === 'ollama')
  const backend = services.find(service => service.id === 'dashboard-backend')

  return (
    <div className="mb-4">
      <div className="metric-label mb-3">Quick Access</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Open WebUI', service: openWebui },
          { label: 'Ollama API', service: ollama },
          { label: 'Dashboard', service: backend },
        ].map(({ label, service }) => (
          <button
            key={label}
            className="card-hover p-4 text-left flex items-center justify-between gap-3"
            onClick={() => service && openService(service.url)}
            disabled={!service}
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-text-primary">{label}</div>
              <div className="text-xs text-text-muted mono truncate mt-1">{service?.url ?? 'Unavailable'}</div>
            </div>
            <ExternalLink size={14} className="text-text-tertiary flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}

function LogsModal({ onClose }: { onClose: () => void }) {
  const { data, isLoading, isError, error } = useOpenWebuiLogs(true)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
      <div className="card p-5 max-w-3xl w-full mx-4 border border-border-strong">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-medium text-text-primary">Open WebUI logs</h3>
            <p className="text-xs text-text-tertiary mono mt-1">Last 200 lines</p>
          </div>
          <button className="btn-ghost text-xs px-3 py-1.5" onClick={onClose}>Close</button>
        </div>

        <div className="bg-bg-base border border-border-default rounded-md h-[420px] overflow-y-auto p-3">
          {isLoading && <LoadingSpinner className="h-full" />}
          {isError && (
            <div className="text-xs text-status-red">
              {error instanceof Error ? error.message : 'Unable to load logs.'}
            </div>
          )}
          {data && (
            <pre className="text-xs text-text-secondary mono whitespace-pre-wrap leading-relaxed">
              {data.logs.length > 0 ? data.logs.join('\n') : 'No logs available.'}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

function ServiceCard({
  service,
  onLogs,
  onRefresh,
}: {
  service: HomelabService
  onLogs: () => void
  onRefresh: () => void
}) {
  const restartOpenWebui = useRestartOpenWebui()
  const isOpenWebui = service.id === 'open-webui'
  const isOllama = service.id === 'ollama'

  return (
    <div className="card p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Server size={14} className="text-text-tertiary" />
            <h3 className="text-sm font-medium text-text-primary">{service.name}</h3>
          </div>
          <div className="text-xs text-text-muted mono truncate mt-1">{service.url}</div>
        </div>
        <span className={cn('badge capitalize flex-shrink-0', statusBadgeClass(service.status))}>{service.status}</span>
      </div>

      <div className="space-y-1.5">
        {service.container_name && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-text-tertiary">Container</span>
            <span className="text-xs text-text-secondary mono">{service.container_name}</span>
          </div>
        )}
        {service.port && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-text-tertiary">Port</span>
            <span className="text-xs text-text-secondary mono">{service.port}</span>
          </div>
        )}
        {typeof service.models_count === 'number' && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-text-tertiary">Models</span>
            <span className="text-xs text-text-secondary mono">{service.models_count}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button className="btn-ghost text-xs" onClick={() => openService(service.url)}>
          <ExternalLink size={12} /> {isOllama ? 'Open API Docs' : 'Open'}
        </button>
        {isOpenWebui && (
          <>
            <button
              className="btn-ghost text-xs"
              onClick={() => restartOpenWebui.mutate()}
              disabled={restartOpenWebui.isPending}
            >
              <RotateCw size={12} className={restartOpenWebui.isPending ? 'animate-spin' : ''} /> Restart
            </button>
            <button className="btn-ghost text-xs" onClick={onLogs}>
              <FileText size={12} /> Logs
            </button>
          </>
        )}
        {isOllama && (
          <button className="btn-ghost text-xs" onClick={onRefresh}>
            <RefreshCw size={12} /> Refresh
          </button>
        )}
      </div>

      {restartOpenWebui.isError && (
        <div className="text-xs text-status-red">
          {restartOpenWebui.error instanceof Error ? restartOpenWebui.error.message : 'Restart failed.'}
        </div>
      )}
    </div>
  )
}

export default function ServicesPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useServices()
  const [showLogs, setShowLogs] = useState(false)

  if (isLoading) return <LoadingSpinner className="h-64" />

  if (isError || !data) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto animate-fade-in">
        <div className="card p-5 border-status-red/30">
          <div className="text-sm font-medium text-status-red">Unable to load services</div>
          <div className="text-xs text-text-tertiary mt-1">
            {error instanceof Error ? error.message : 'Check that the FastAPI backend is running.'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto animate-fade-in">
      {showLogs && <LogsModal onClose={() => setShowLogs(false)} />}

      <PageHeader
        title="Services"
        subtitle={`${data.services.length} homelab services · Control center`}
      >
        <button className="btn-ghost text-xs" onClick={() => refetch()}>
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </button>
      </PageHeader>

      <QuickAccess services={data.services} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {data.services.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            onLogs={() => setShowLogs(true)}
            onRefresh={() => refetch()}
          />
        ))}
      </div>
    </div>
  )
}
