import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type DockerAction,
  getDockerContainerRows,
  getDockerLogs,
  runDockerAction,
} from '@/services/dockerApi'

export function useDockerContainers() {
  return useQuery({
    queryKey: ['docker-containers'],
    queryFn: getDockerContainerRows,
    refetchInterval: 5000,
  })
}

export function useDockerAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ containerId, action }: { containerId: string; action: DockerAction }) =>
      runDockerAction(containerId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docker-containers'] })
    },
  })
}

export function useDockerLogs(containerId: string | null) {
  return useQuery({
    queryKey: ['docker-logs', containerId],
    queryFn: () => getDockerLogs(containerId!),
    enabled: Boolean(containerId),
  })
}
