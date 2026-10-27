import type { z } from 'zod'

import type { KeyValueStore } from './key-value-store'

/** Generic repository port for any entity identified by `id`. */
export interface Collection<T extends { id: string }> {
  list(): Promise<T[]>
  get(id: string): Promise<T | undefined>
  upsert(item: T): Promise<T>
  upsertMany(items: T[]): Promise<void>
  remove(id: string): Promise<void>
  /**
   * Atomic read-modify-write: nothing else can read or write the collection while `task` runs.
   * Use it when a decision depends on the current data (e.g. reserve stock only if available).
   * If `task` throws, nothing is saved.
   */
  mutate<R>(task: (items: T[]) => { items: T[]; result: R }): Promise<R>
  /** Restores the initial demo data. */
  reset(): Promise<void>
}

interface StoredCollectionOptions<T extends { id: string }> {
  store: KeyValueStore
  key: string
  schema: z.ZodType<T, z.ZodTypeDef, unknown>
  seed: () => T[]
}

/**
 * Collection backed by a {@link KeyValueStore}. Invalid or missing data falls back to the seed,
 * and writes are serialised so concurrent updates never overwrite each other.
 */
export function createStoredCollection<T extends { id: string }>({
  store,
  key,
  schema,
  seed,
}: StoredCollectionOptions<T>): Collection<T> {
  let queue: Promise<unknown> = Promise.resolve()
  const exclusive = <R>(task: () => Promise<R>): Promise<R> => {
    const run = queue.then(task)
    queue = run.catch(() => undefined)
    return run
  }

  async function load(): Promise<T[]> {
    const raw = await store.read(key)
    const parsed = schema.array().safeParse(raw)
    if (parsed.success) return parsed.data
    const initial = seed()
    await store.write(key, initial)
    return initial
  }

  const replaceAll = async (items: T[]) => store.write(key, items)

  return {
    list: () => exclusive(load),
    get: (id) => exclusive(async () => (await load()).find((item) => item.id === id)),
    upsert: (item) =>
      exclusive(async () => {
        const items = await load()
        const index = items.findIndex((candidate) => candidate.id === item.id)
        await replaceAll(
          index === -1
            ? [item, ...items]
            : items.map((entry) => (entry.id === item.id ? item : entry)),
        )
        return item
      }),
    upsertMany: (incoming) =>
      exclusive(async () => {
        const items = await load()
        const byId = new Map(incoming.map((item) => [item.id, item]))
        const merged = items.map((item) => byId.get(item.id) ?? item)
        const added = incoming.filter((item) => !items.some((entry) => entry.id === item.id))
        await replaceAll([...added, ...merged])
      }),
    remove: (id) =>
      exclusive(async () => replaceAll((await load()).filter((item) => item.id !== id))),
    mutate: (task) =>
      exclusive(async () => {
        const { items, result } = task(await load())
        await replaceAll(items)
        return result
      }),
    reset: () => exclusive(async () => replaceAll(seed())),
  }
}
