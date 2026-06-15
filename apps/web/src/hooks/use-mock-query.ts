import { useQuery } from '@tanstack/react-query'

export function useMockQuery<T>(key: string[], data: T, delay = 300) {
  return useQuery({
    queryKey: key,
    queryFn: () =>
      new Promise<T>((resolve) => setTimeout(() => resolve(data), delay)),
    staleTime: Infinity,
  })
}
