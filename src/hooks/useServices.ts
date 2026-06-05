import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getOpenWebuiLogs, getServices, restartOpenWebui } from '@/services/servicesApi'

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: getServices,
    refetchInterval: 10000,
  })
}

export function useRestartOpenWebui() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: restartOpenWebui,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useOpenWebuiLogs(enabled: boolean) {
  return useQuery({
    queryKey: ['services', 'open-webui', 'logs'],
    queryFn: getOpenWebuiLogs,
    enabled,
  })
}
