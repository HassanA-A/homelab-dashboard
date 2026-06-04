// ─── Types ────────────────────────────────────────────────────────────────────

export interface SystemMetrics {
  cpu: { usage: number; cores: number; model: string; temp: number }
  ram: { used: number; total: number; percent: number }
  gpu: { usage: number; vramUsed: number; vramTotal: number; model: string; temp: number }
  disk: { used: number; total: number; percent: number; readSpeed: number; writeSpeed: number }
  network: { uploadMbps: number; downloadMbps: number; interface: string }
  tailscale: { connected: boolean; ip: string; peers: number; hostname: string }
  uptime: number // seconds
  os: string
  hostname: string
  kernelVersion: string
  lastUpdated: Date
}

export interface OllamaModel {
  id: string
  name: string
  tag: string
  fullName: string
  sizeGB: number
  quantization: string
  contextWindow: number
  lastUsed: Date | null
  status: 'ready' | 'loading' | 'error'
  parameters: string
}

export interface Container {
  id: string
  name: string
  image: string
  status: 'running' | 'stopped' | 'restarting' | 'error'
  cpuPercent: number
  memUsedMB: number
  memLimitMB: number
  ports: string[]
  uptime: number | null // seconds, null if stopped
  created: Date
}

export interface InfraStatus {
  ssh: { enabled: boolean; port: number; connections: number }
  tailscale: { connected: boolean; ip: string; peers: { name: string; ip: string; online: boolean }[] }
  uptime: number
  os: string
  kernelVersion: string
  hostname: string
  storage: { device: string; mount: string; used: number; total: number }[]
}

export interface Agent {
  id: string
  name: string
  description: string
  status: 'active' | 'idle' | 'error' | 'beta'
  lastRun: Date | null
  runsToday: number
  logs: { time: Date; level: 'info' | 'warn' | 'error'; message: string }[]
}

// ─── Mock data generators ─────────────────────────────────────────────────────

const jitter = (base: number, range: number) =>
  Math.min(100, Math.max(0, base + (Math.random() - 0.5) * range))

export function getMockSystemMetrics(): SystemMetrics {
  return {
    cpu: { usage: jitter(24, 8), cores: 16, model: 'AMD Ryzen 9 5950X', temp: jitter(62, 6) },
    ram: { used: 47.2, total: 64, percent: jitter(73, 4) },
    gpu: { usage: jitter(8, 12), vramUsed: 4.2, vramTotal: 24, model: 'NVIDIA RTX 4090', temp: jitter(55, 5) },
    disk: { used: 2400, total: 4000, percent: 61, readSpeed: jitter(380, 40), writeSpeed: jitter(220, 30) },
    network: { uploadMbps: jitter(42, 10), downloadMbps: jitter(128, 20), interface: 'eth0' },
    tailscale: { connected: true, ip: '100.88.12.42', peers: 3, hostname: 'homelab' },
    uptime: 3 * 86400 + 14 * 3600 + 22 * 60,
    os: 'Ubuntu 24.04 LTS',
    hostname: 'homelab.local',
    kernelVersion: '6.8.0-45-generic',
    lastUpdated: new Date(),
  }
}

export function getMockModels(): OllamaModel[] {
  return [
    {
      id: '1', name: 'llama3', tag: '8b', fullName: 'meta-llama/Meta-Llama-3-8B',
      sizeGB: 4.7, quantization: 'Q4_K_M', contextWindow: 8192,
      lastUsed: new Date(Date.now() - 3 * 60 * 1000), status: 'ready', parameters: '8B',
    },
    {
      id: '2', name: 'mistral', tag: '7b', fullName: 'mistralai/Mistral-7B-Instruct-v0.3',
      sizeGB: 4.1, quantization: 'Q4_K_M', contextWindow: 32768,
      lastUsed: new Date(Date.now() - 60 * 60 * 1000), status: 'ready', parameters: '7B',
    },
    {
      id: '3', name: 'phi3', tag: 'mini', fullName: 'microsoft/Phi-3-mini-4k',
      sizeGB: 2.2, quantization: 'Q8_0', contextWindow: 4096,
      lastUsed: new Date(Date.now() - 2 * 86400 * 1000), status: 'ready', parameters: '3.8B',
    },
    {
      id: '4', name: 'codellama', tag: '13b', fullName: 'meta-llama/CodeLlama-13b-Instruct',
      sizeGB: 7.4, quantization: 'FP16', contextWindow: 16384,
      lastUsed: new Date(Date.now() - 86400 * 1000), status: 'ready', parameters: '13B',
    },
    {
      id: '5', name: 'gemma2', tag: '2b', fullName: 'google/gemma-2-2b-it',
      sizeGB: 1.6, quantization: 'Q4_K_M', contextWindow: 8192,
      lastUsed: null, status: 'ready', parameters: '2B',
    },
  ]
}

export function getMockContainers(): Container[] {
  return [
    {
      id: 'a1b2', name: 'ollama', image: 'ollama/ollama:latest',
      status: 'running', cpuPercent: jitter(8, 3), memUsedMB: 4200, memLimitMB: 16000,
      ports: ['11434:11434'], uptime: 3 * 86400 + 14 * 3600, created: new Date(Date.now() - 4 * 86400 * 1000),
    },
    {
      id: 'c3d4', name: 'open-webui', image: 'ghcr.io/open-webui/open-webui:main',
      status: 'running', cpuPercent: jitter(2, 1), memUsedMB: 380, memLimitMB: 2000,
      ports: ['3000:8080'], uptime: 3 * 86400 + 14 * 3600, created: new Date(Date.now() - 4 * 86400 * 1000),
    },
    {
      id: 'e5f6', name: 'n8n', image: 'n8nio/n8n:latest',
      status: 'running', cpuPercent: jitter(31, 8), memUsedMB: 890, memLimitMB: 4000,
      ports: ['5678:5678'], uptime: 6 * 3600 + 22 * 60, created: new Date(Date.now() - 7 * 86400 * 1000),
    },
    {
      id: 'g7h8', name: 'portainer', image: 'portainer/portainer-ce:latest',
      status: 'running', cpuPercent: jitter(0.5, 0.3), memUsedMB: 45, memLimitMB: 512,
      ports: ['9443:9443', '9000:9000'], uptime: 14 * 86400, created: new Date(Date.now() - 14 * 86400 * 1000),
    },
    {
      id: 'i9j0', name: 'nginx-proxy', image: 'nginxproxy/nginx-proxy:latest',
      status: 'running', cpuPercent: jitter(0.3, 0.2), memUsedMB: 28, memLimitMB: 256,
      ports: ['80:80', '443:443'], uptime: 14 * 86400, created: new Date(Date.now() - 14 * 86400 * 1000),
    },
    {
      id: 'k1l2', name: 'searxng', image: 'searxng/searxng:latest',
      status: 'running', cpuPercent: jitter(1.2, 0.5), memUsedMB: 120, memLimitMB: 1000,
      ports: ['8888:8080'], uptime: 2 * 86400, created: new Date(Date.now() - 5 * 86400 * 1000),
    },
    {
      id: 'm3n4', name: 'postgres', image: 'postgres:16-alpine',
      status: 'stopped', cpuPercent: 0, memUsedMB: 0, memLimitMB: 2000,
      ports: ['5432:5432'], uptime: null, created: new Date(Date.now() - 10 * 86400 * 1000),
    },
    {
      id: 'o5p6', name: 'redis', image: 'redis:7-alpine',
      status: 'stopped', cpuPercent: 0, memUsedMB: 0, memLimitMB: 512,
      ports: ['6379:6379'], uptime: null, created: new Date(Date.now() - 10 * 86400 * 1000),
    },
  ]
}

export function getMockInfra(): InfraStatus {
  return {
    ssh: { enabled: true, port: 22, connections: 1 },
    tailscale: {
      connected: true, ip: '100.88.12.42',
      peers: [
        { name: 'macbook-pro', ip: '100.88.12.10', online: true },
        { name: 'iphone-15', ip: '100.88.12.11', online: true },
        { name: 'work-laptop', ip: '100.88.12.15', online: false },
      ],
    },
    uptime: 3 * 86400 + 14 * 3600 + 22 * 60,
    os: 'Ubuntu 24.04 LTS',
    kernelVersion: '6.8.0-45-generic',
    hostname: 'homelab.local',
    storage: [
      { device: '/dev/nvme0n1p2', mount: '/', used: 180, total: 500 },
      { device: '/dev/sda1', mount: '/data', used: 2200, total: 4000 },
      { device: '/dev/sdb1', mount: '/backup', used: 880, total: 2000 },
    ],
  }
}

export function getMockAgents(): Agent[] {
  return [
    {
      id: '1', name: 'file-organizer', description: 'Watches ~/Downloads and organizes files by type',
      status: 'active', lastRun: new Date(Date.now() - 5 * 60 * 1000), runsToday: 14,
      logs: [
        { time: new Date(Date.now() - 5 * 60 * 1000), level: 'info', message: 'Moved 3 PDF files to /data/docs/pdfs' },
        { time: new Date(Date.now() - 12 * 60 * 1000), level: 'info', message: 'Moved 2 images to /data/photos/2024' },
        { time: new Date(Date.now() - 18 * 60 * 1000), level: 'warn', message: 'Unknown file type: .crdownload — skipped' },
      ],
    },
    {
      id: '2', name: 'model-updater', description: 'Checks for newer Ollama model versions nightly',
      status: 'idle', lastRun: new Date(Date.now() - 8 * 3600 * 1000), runsToday: 1,
      logs: [
        { time: new Date(Date.now() - 8 * 3600 * 1000), level: 'info', message: 'All models up to date' },
        { time: new Date(Date.now() - 32 * 3600 * 1000), level: 'info', message: 'Updated llama3:8b → digest sha256:abc' },
      ],
    },
    {
      id: '3', name: 'backup-agent', description: 'Syncs /data to remote NAS via rsync nightly',
      status: 'error', lastRun: new Date(Date.now() - 2 * 3600 * 1000), runsToday: 1,
      logs: [
        { time: new Date(Date.now() - 2 * 3600 * 1000), level: 'error', message: 'rsync: connection refused — NAS offline?' },
        { time: new Date(Date.now() - 26 * 3600 * 1000), level: 'info', message: 'Backup complete. 14.2 GB synced in 4m 12s' },
      ],
    },
    {
      id: '4', name: 'ai-summarizer', description: 'Summarizes clipboard content with local LLM on hotkey',
      status: 'beta', lastRun: new Date(Date.now() - 45 * 60 * 1000), runsToday: 7,
      logs: [
        { time: new Date(Date.now() - 45 * 60 * 1000), level: 'info', message: 'Summarized 2,400 chars via llama3:8b' },
      ],
    },
  ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatBytes(gb: number): string {
  if (gb < 1) return `${(gb * 1024).toFixed(0)} MB`
  return `${gb.toFixed(1)} GB`
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatContext(n: number): string {
  return `${(n / 1024).toFixed(0)}k`
}

export function timeAgo(date: Date | null): string {
  if (!date) return 'Never'
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}