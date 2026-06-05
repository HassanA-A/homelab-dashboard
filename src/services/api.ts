export interface SystemMetrics {
  cpu: number
  ram: number
  disk: number
  uptime: string
  hostname: string
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function getSystemMetrics() {
  return request<SystemMetrics>('/api/system')
}
