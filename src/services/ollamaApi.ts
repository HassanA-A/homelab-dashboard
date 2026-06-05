export interface OllamaModel {
  name: string
  size_bytes: number
  size_display: string
  modified_at: string
  parameter_size: string
  quantization: string
  family: string
  context_length: number
  capabilities: string[]
}

export interface OllamaModelsResponse {
  models: OllamaModel[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)

  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    throw new Error(detail?.detail ?? `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const getOllamaModels = () => request<OllamaModelsResponse>('/api/ollama/models')

export function pullOllamaModel(model: string) {
  return request<{ message: string }>('/api/ollama/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  })
}

export function deleteOllamaModel(modelName: string) {
  return request<{ message: string }>(`/api/ollama/models/${encodeURIComponent(modelName)}`, {
    method: 'DELETE',
  })
}
