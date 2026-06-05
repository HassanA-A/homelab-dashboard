import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSystemMetrics } from '@/services/api'
import {
  getMockModels,
  getMockContainers,
  getMockInfra,
  getMockAgents,
} from '@/data/mock'

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export function useSystemMetrics() {
  return useQuery({
    queryKey: ['system-metrics'],
    queryFn: getSystemMetrics,
    refetchInterval: 3000,
  })
}

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      await delay(300)
      return getMockModels()
    },
  })
}

export function useContainers() {
  return useQuery({
    queryKey: ['containers'],
    queryFn: async () => {
      await delay(250)
      return getMockContainers()
    },
    refetchInterval: 5000,
  })
}

export function useInfra() {
  return useQuery({
    queryKey: ['infra'],
    queryFn: async () => {
      await delay(200)
      return getMockInfra()
    },
    refetchInterval: 10000,
  })
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      await delay(250)
      return getMockAgents()
    },
    refetchInterval: 8000,
  })
}

export function useDeleteModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await delay(800)
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['models'] }),
  })
}

export function useToggleContainer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'start' | 'stop' | 'restart' }) => {
      await delay(600)
      return { id, action }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['containers'] }),
  })
}
