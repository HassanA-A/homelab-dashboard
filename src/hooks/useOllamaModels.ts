import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteOllamaModel, getOllamaModels, pullOllamaModel } from '@/services/ollamaApi'

export function useOllamaModels() {
  return useQuery({
    queryKey: ['ollama-models'],
    queryFn: getOllamaModels,
    refetchInterval: 10000,
  })
}

export function usePullOllamaModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pullOllamaModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] })
    },
  })
}

export function useDeleteOllamaModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteOllamaModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] })
    },
  })
}
