export interface CpuMetrics {
  model: string
  usage: number
  cores: number
  threads: number
}

export interface RamMetrics {
  used_gb: number
  total_gb: number
  usage: number
}

export interface GpuMetrics {
  name: string
  usage: number
  vram_used_gb: number
  vram_total_gb: number
  temperature: number
}

export interface StorageMetrics {
  used_gb: number
  total_gb: number
  usage: number
}

export interface NetworkMetrics {
  download_mbps: number
  upload_mbps: number
  local_ip: string
}

export interface TailscaleMetrics {
  connected: boolean
  tailscale_ip: string
  peer_count: number
}

export interface SystemInfo {
  hostname: string
  os: string
  kernel: string
  architecture: string
  cpu_model: string
  total_ram_gb: number
  gpu_model: string
  storage_total_gb: number
  uptime: string
}

export interface OverviewSystemMetrics {
  cpu: CpuMetrics
  ram: RamMetrics
  gpu: GpuMetrics
  storage: StorageMetrics
  network: NetworkMetrics
  tailscale: TailscaleMetrics
  info: SystemInfo
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const getCpuMetrics = () => request<CpuMetrics>('/api/system/cpu')
export const getRamMetrics = () => request<RamMetrics>('/api/system/ram')
export const getGpuMetrics = () => request<GpuMetrics>('/api/system/gpu')
export const getStorageMetrics = () => request<StorageMetrics>('/api/system/storage')
export const getNetworkMetrics = () => request<NetworkMetrics>('/api/system/network')
export const getTailscaleMetrics = () => request<TailscaleMetrics>('/api/system/tailscale')
export const getSystemInfo = () => request<SystemInfo>('/api/system/info')

export async function getOverviewSystemMetrics(): Promise<OverviewSystemMetrics> {
  const [cpu, ram, gpu, storage, network, tailscale, info] = await Promise.all([
    getCpuMetrics(),
    getRamMetrics(),
    getGpuMetrics(),
    getStorageMetrics(),
    getNetworkMetrics(),
    getTailscaleMetrics(),
    getSystemInfo(),
  ])

  return { cpu, ram, gpu, storage, network, tailscale, info }
}
