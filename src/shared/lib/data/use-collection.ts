import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Collection } from '../storage/collection'

const EMPTY: never[] = []

/** Query key shared by every consumer of the same collection so updates propagate across screens. */
export const collectionKey = (name: string) => ['collection', name] as const

/** Reads a collection and exposes mutations that refresh every screen that uses it. */
export function useCollection<T extends { id: string }>(name: string, collection: Collection<T>) {
  const queryClient = useQueryClient()
  const queryKey = collectionKey(name)
  const refresh = () => queryClient.invalidateQueries({ queryKey })

  const query = useQuery({ queryKey, queryFn: () => collection.list() })
  const upsert = useMutation({
    mutationFn: (item: T) => collection.upsert(item),
    onSuccess: refresh,
  })
  const upsertMany = useMutation({
    mutationFn: (items: T[]) => collection.upsertMany(items),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (id: string) => collection.remove(id),
    onSuccess: refresh,
  })

  return {
    items: (query.data ?? EMPTY) as T[],
    isLoading: query.isPending,
    upsert: upsert.mutateAsync,
    upsertMany: upsertMany.mutateAsync,
    remove: remove.mutateAsync,
    /** Re-reads the collection on every screen. Call it after changing the repository directly. */
    refresh,
  }
}
