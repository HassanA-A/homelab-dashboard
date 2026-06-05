export type ServiceStatus = 'healthy' | 'running' | 'offline' | 'missing' | 'unknown' | string

export interface HomelabService {
  id: string
  name: string
  status: ServiceStatus
  url: string
  container_name?: string
  port?: number
  kind?: string
  models_count?: number
  actions?: string[]
}

export interface ServicesResponse {
  services: HomelabService[]
}

export interface ServiceLogs {
  logs: string[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)

  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    throw new Error(detail?.detail ?? `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const getServices = () => request<ServicesResponse>('/api/services')

export const restartOpenWebui = () => request<{ message: string }>('/api/services/open-webui/restart', {
  method: 'POST',
})

export const getOpenWebuiLogs = () => request<ServiceLogs>('/api/services/open-webui/logs')
