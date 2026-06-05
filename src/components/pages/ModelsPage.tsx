import { useState } from 'react'
import { useDeleteOllamaModel, useOllamaModels, usePullOllamaModel } from '@/hooks/useOllamaModels'
import { LoadingSpinner, PageHeader, StatusDot, QuantBadge } from '@/components/ui'
import type { OllamaModel } from '@/services/ollamaApi'
import { Download, Trash2, MessageSquare, Play, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type SortKey = 'name' | 'size_bytes' | 'context_length' | 'modified_at'

function formatContext(n: number): string {
  if (!n) return '—'
  return `${(n / 1024).toFixed(0)}k`
}

function formatDate(value: string): string {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function DeleteConfirm({ model, onConfirm, onCancel, isPending }: {
  model: OllamaModel; onConfirm: () => void; onCancel: () => void; isPending: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
      <div className="card p-5 max-w-sm w-full mx-4 border border-border-strong">
        <h3 className="text-sm font-medium text-text-primary mb-1.5">Delete model?</h3>
        <p className="text-xs text-text-tertiary mb-4">
          <span className="mono text-text-secondary">{model.name}</span> ({model.size_display}) will be permanently deleted from disk.
        </p>
        <div className="flex gap-2 justify-end">
          <button className="btn-ghost text-xs px-3 py-1.5" onClick={onCancel}>Cancel</button>
          <button
            className="btn-danger text-xs px-3 py-1.5"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PullModelModal({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState('')
  const pullMutation = usePullOllamaModel()

  function handlePull() {
    const model = value.trim()
    if (!model) return
    pullMutation.mutate(model, {
      onSuccess: onClose,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
      <div className="card p-5 max-w-md w-full mx-4 border border-border-strong">
        <h3 className="text-sm font-medium text-text-primary mb-1.5">Pull model</h3>
        <p className="text-xs text-text-tertiary mb-3">Enter a model name from the Ollama library (e.g. <span className="mono">llama3:latest</span>)</p>
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="llama3.1:8b"
          className="w-full bg-bg-raised border border-border-default rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted mono focus:outline-none focus:border-accent-purple mb-4"
        />
        {pullMutation.isError && (
          <div className="text-xs text-status-red mb-4">
            {pullMutation.error instanceof Error ? pullMutation.error.message : 'Failed to pull model.'}
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button className="btn-ghost text-xs" onClick={onClose}>Cancel</button>
          <button className="btn-primary text-xs" onClick={handlePull} disabled={pullMutation.isPending || !value.trim()}>
            <Download size={12} /> {pullMutation.isPending ? 'Pulling…' : 'Pull'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ModelsPage() {
  const { data, isLoading, isError, error } = useOllamaModels()
  const deleteMutation = useDeleteOllamaModel()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [deleteTarget, setDeleteTarget] = useState<OllamaModel | null>(null)
  const [showPull, setShowPull] = useState(false)

  if (isLoading) return <LoadingSpinner className="h-64" />

  if (isError || !data) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto animate-fade-in">
        <div className="card p-5 border-status-red/30">
          <div className="text-sm font-medium text-status-red">Unable to load Ollama models</div>
          <div className="text-xs text-text-tertiary mt-1">
            {error instanceof Error ? error.message : 'Check that Ollama is running on localhost:11434.'}
          </div>
        </div>
      </div>
    )
  }

  const models = data.models

  const filtered = models
    .filter(m => `${m.name} ${m.family} ${m.parameter_size} ${m.quantization} ${m.capabilities.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let diff = 0
      if (sortKey === 'name') diff = a.name.localeCompare(b.name)
      if (sortKey === 'size_bytes') diff = a.size_bytes - b.size_bytes
      if (sortKey === 'context_length') diff = a.context_length - b.context_length
      if (sortKey === 'modified_at') diff = new Date(a.modified_at).getTime() - new Date(b.modified_at).getTime()
      return sortDir === 'asc' ? diff : -diff
    })

  const totalBytes = models.reduce((s, m) => s + m.size_bytes, 0)
  const totalGB = totalBytes / 1024 / 1024 / 1024

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp size={10} className="opacity-20" />
    return sortDir === 'asc'
      ? <ChevronUp size={10} className="text-accent-purple" />
      : <ChevronDown size={10} className="text-accent-purple" />
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto animate-fade-in">
      {deleteTarget && (
        <DeleteConfirm
          model={deleteTarget}
          onConfirm={() => { deleteMutation.mutate(deleteTarget.name); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
          isPending={deleteMutation.isPending}
        />
      )}
      {showPull && <PullModelModal onClose={() => setShowPull(false)} />}

      <PageHeader
        title="AI Models"
        subtitle={`Ollama · ${models.length} models installed · ${totalGB.toFixed(1)} GB total`}
      >
        <button className="btn-ghost text-xs">
          <Search size={12} /> Filter
        </button>
        <button className="btn-primary text-xs" onClick={() => setShowPull(true)}>
          <Download size={12} /> Pull Model
        </button>
      </PageHeader>

      {/* Search */}
      <div className="flex items-center gap-2 bg-bg-raised border border-border-default rounded-md px-3 py-2 mb-4">
        <Search size={13} className="text-text-muted flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search models…"
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {([
                ['Model', 'name'],
                ['Quant', null],
                ['Size', 'size_bytes'],
                ['Context', 'context_length'],
                ['Modified', 'modified_at'],
                ['Family', null],
                ['Capabilities', null],
              ] as [string, SortKey | null][]).map(([label, key]) => (
                <th
                  key={label}
                  className={cn('table-head text-left', key && 'cursor-pointer hover:text-text-secondary transition-colors select-none')}
                  onClick={() => key && toggleSort(key)}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    {key && <SortIcon k={key} />}
                  </div>
                </th>
              ))}
              <th className="table-head text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(model => (
              <tr key={model.name} className="table-row group">
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <StatusDot status="running" />
                    <div>
                      <div className="text-sm font-medium text-text-primary mono">
                        {model.name}
                      </div>
                      <div className="text-xs text-text-muted truncate max-w-[220px]">{model.parameter_size}</div>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <QuantBadge quant={model.quantization} />
                </td>
                <td className="table-cell">
                  <span className="text-sm text-text-secondary mono">{model.size_display}</span>
                </td>
                <td className="table-cell">
                  <span className="text-sm text-text-secondary mono">{formatContext(model.context_length)}</span>
                </td>
                <td className="table-cell">
                  <span className="text-xs text-text-tertiary">{formatDate(model.modified_at)}</span>
                </td>
                <td className="table-cell">
                  <span className="text-xs text-text-secondary">{model.family}</span>
                </td>
                <td className="table-cell">
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {model.capabilities.length > 0
                      ? model.capabilities.map(capability => (
                        <span key={capability} className="badge badge-gray">{capability}</span>
                      ))
                      : <span className="text-xs text-text-muted">—</span>}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="icon-btn-success" title="Test prompt">
                      <Play size={11} />
                    </button>
                    <button className="icon-btn" title="Chat">
                      <MessageSquare size={11} />
                    </button>
                    <button
                      className="icon-btn-danger"
                      title="Delete"
                      onClick={() => setDeleteTarget(model)}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-text-muted">No models match your search.</div>
        )}
      </div>

      {/* Storage breakdown */}
      <div className="card p-4 mt-3">
        <div className="metric-label mb-3">Storage breakdown</div>
        <div className="space-y-2">
          {models.length === 0 && (
            <div className="py-3 text-center text-sm text-text-muted">No Ollama models installed.</div>
          )}
          {models.map(m => (
            <div key={m.name} className="flex items-center gap-3">
              <div className="w-28 text-xs text-text-secondary mono truncate">{m.name}</div>
              <div className="flex-1 bg-bg-active rounded-full h-[3px] overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-purple transition-all duration-500"
                  style={{ width: `${totalBytes > 0 ? (m.size_bytes / totalBytes) * 100 : 0}%` }}
                />
              </div>
              <div className="w-14 text-right text-xs text-text-tertiary mono">{m.size_display}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
