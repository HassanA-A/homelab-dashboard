import { useQuery } from '@tanstack/react-query'
import { getOverviewSystemMetrics } from '@/services/systemApi'
import {
  getMockInfra,
  getMockAgents,
} from '@/data/mock'

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export function useSystemMetrics() {
  return useQuery({
    queryKey: ['overview-system-metrics'],
    queryFn: getOverviewSystemMetrics,
    refetchInterval: 3000,
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
