import { useState } from 'react'
import { useModels, useDeleteModel } from '@/hooks/useMetrics'
import { LoadingSpinner, PageHeader, StatusDot, QuantBadge } from '@/components/ui'
import { formatBytes, formatContext, timeAgo, type OllamaModel } from '@/data/mock'
import { Download, Trash2, MessageSquare, Play, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type SortKey = 'name' | 'sizeGB' | 'contextWindow' | 'lastUsed'

function DeleteConfirm({ model, onConfirm, onCancel, isPending }: {
  model: OllamaModel; onConfirm: () => void; onCancel: () => void; isPending: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
      <div className="card p-5 max-w-sm w-full mx-4 border border-border-strong">
        <h3 className="text-sm font-medium text-text-primary mb-1.5">Delete model?</h3>
        <p className="text-xs text-text-tertiary mb-4">
          <span className="mono text-text-secondary">{model.name}:{model.tag}</span> ({formatBytes(model.sizeGB)}) will be permanently deleted from disk.
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
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
      <div className="card p-5 max-w-md w-full mx-4 border border-border-strong">
        <h3 className="text-sm font-medium text-text-primary mb-1.5">Pull model</h3>
        <p className="text-xs text-text-tertiary mb-3">Enter a model name from the Ollama library (e.g. <span className="mono">llama3:latest</span>)</p>
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="model:tag"
          className="w-full bg-bg-raised border border-border-default rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted mono focus:outline-none focus:border-accent-purple mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button className="btn-ghost text-xs" onClick={onClose}>Cancel</button>
          <button className="btn-primary text-xs" onClick={onClose}>
            <Download size={12} /> Pull
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ModelsPage() {
  const { data: models, isLoading } = useModels()
  const deleteMutation = useDeleteModel()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [deleteTarget, setDeleteTarget] = useState<OllamaModel | null>(null)
  const [showPull, setShowPull] = useState(false)

  if (isLoading || !models) return <LoadingSpinner className="h-64" />

  const filtered = models
    .filter(m => `${m.name}:${m.tag} ${m.fullName}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let diff = 0
      if (sortKey === 'name') diff = `${a.name}:${a.tag}`.localeCompare(`${b.name}:${b.tag}`)
      if (sortKey === 'sizeGB') diff = a.sizeGB - b.sizeGB
      if (sortKey === 'contextWindow') diff = a.contextWindow - b.contextWindow
      if (sortKey === 'lastUsed') diff = (a.lastUsed?.getTime() ?? 0) - (b.lastUsed?.getTime() ?? 0)
      return sortDir === 'asc' ? diff : -diff
    })

  const totalGB = models.reduce((s, m) => s + m.sizeGB, 0)

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
          onConfirm={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null) }}
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
                ['Size', 'sizeGB'],
                ['Context', 'contextWindow'],
                ['Last used', 'lastUsed'],
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
              <tr key={model.id} className="table-row group">
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <StatusDot status={model.status === 'ready' ? 'running' : 'stopped'} />
                    <div>
                      <div className="text-sm font-medium text-text-primary mono">
                        {model.name}:{model.tag}
                      </div>
                      <div className="text-xs text-text-muted truncate max-w-[220px]">{model.fullName}</div>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <QuantBadge quant={model.quantization} />
                </td>
                <td className="table-cell">
                  <span className="text-sm text-text-secondary mono">{formatBytes(model.sizeGB)}</span>
                </td>
                <td className="table-cell">
                  <span className="text-sm text-text-secondary mono">{formatContext(model.contextWindow)}</span>
                </td>
                <td className="table-cell">
                  <span className="text-xs text-text-tertiary">{timeAgo(model.lastUsed)}</span>
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
          {models.map(m => (
            <div key={m.id} className="flex items-center gap-3">
              <div className="w-28 text-xs text-text-secondary mono truncate">{m.name}:{m.tag}</div>
              <div className="flex-1 bg-bg-active rounded-full h-[3px] overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-purple transition-all duration-500"
                  style={{ width: `${(m.sizeGB / totalGB) * 100}%` }}
                />
              </div>
              <div className="w-14 text-right text-xs text-text-tertiary mono">{formatBytes(m.sizeGB)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}