export interface DockerContainer {
  id: string
  name: string
  image: string
  status: string
  created: string
  ports: string[]
}

export interface DockerStats {
  container_id: string
  cpu_percent: number
  memory_used_mb: number
  memory_limit_mb: number
}

export interface DockerContainerRow extends DockerContainer {
  cpu_percent: number
  memory_used_mb: number
  memory_limit_mb: number
}

export interface DockerLogs {
  logs: string[]
}

export type DockerAction = 'start' | 'stop' | 'restart'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)

  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    throw new Error(detail?.detail ?? `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const getDockerContainers = () => request<DockerContainer[]>('/api/docker/containers')
export const getDockerStats = () => request<DockerStats[]>('/api/docker/stats')
export const getDockerLogs = (containerId: string) => request<DockerLogs>(`/api/docker/${containerId}/logs`)

export function runDockerAction(containerId: string, action: DockerAction) {
  return request<{ message: string }>(`/api/docker/${containerId}/${action}`, {
    method: 'POST',
  })
}

export async function getDockerContainerRows(): Promise<DockerContainerRow[]> {
  const [containers, stats] = await Promise.all([
    getDockerContainers(),
    getDockerStats(),
  ])
  const statsByContainer = new Map(stats.map(item => [item.container_id, item]))

  return containers.map(container => {
    const containerStats = statsByContainer.get(container.id)
    return {
      ...container,
      cpu_percent: containerStats?.cpu_percent ?? 0,
      memory_used_mb: containerStats?.memory_used_mb ?? 0,
      memory_limit_mb: containerStats?.memory_limit_mb ?? 0,
    }
  })
}
