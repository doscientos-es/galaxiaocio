import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { createStoredCollection } from './collection'
import { createLocalStorageStore } from './local-storage-store'
import { createMemoryStore } from './memory-store'

const itemSchema = z.object({ id: z.string(), label: z.string() })
const seed = () => [{ id: 'a', label: 'Seed' }]

describe('createStoredCollection', () => {
  it('starts from the seed and persists changes', async () => {
    const store = createMemoryStore()
    const collection = createStoredCollection({ store, key: 'items', schema: itemSchema, seed })
    expect(await collection.list()).toEqual(seed())

    await collection.upsert({ id: 'b', label: 'New' })
    await collection.upsert({ id: 'a', label: 'Changed' })
    expect(await collection.list()).toEqual([
      { id: 'b', label: 'New' },
      { id: 'a', label: 'Changed' },
    ])
  })

  it('keeps concurrent writes instead of overwriting them', async () => {
    const collection = createStoredCollection({
      store: createMemoryStore(),
      key: 'items',
      schema: itemSchema,
      seed,
    })
    await Promise.all([
      collection.upsert({ id: 'b', label: 'B' }),
      collection.upsert({ id: 'c', label: 'C' }),
      collection.upsertMany([{ id: 'd', label: 'D' }]),
    ])
    expect((await collection.list()).map((item) => item.id).sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('mutates atomically and saves nothing when the task throws', async () => {
    const collection = createStoredCollection({
      store: createMemoryStore(),
      key: 'items',
      schema: itemSchema,
      seed,
    })
    await Promise.all(
      [1, 2, 3].map((n) =>
        collection.mutate((items) => ({
          items: [...items, { id: `n${n}`, label: String(items.length) }],
          result: undefined,
        })),
      ),
    )
    // Each task saw the result of the previous one: labels are 1, 2, 3 and never repeat.
    expect((await collection.list()).slice(1).map((item) => item.label)).toEqual(['1', '2', '3'])

    await expect(
      collection.mutate(() => {
        throw new Error('refused')
      }),
    ).rejects.toThrow('refused')
    expect(await collection.list()).toHaveLength(4)
  })

  it('falls back to the seed when stored data is invalid, and can be reset', async () => {
    const store = createMemoryStore()
    await store.write('items', [{ unexpected: true }])
    const collection = createStoredCollection({ store, key: 'items', schema: itemSchema, seed })
    expect(await collection.list()).toEqual(seed())

    await collection.remove('a')
    expect(await collection.list()).toEqual([])
    await collection.reset()
    expect(await collection.list()).toEqual(seed())
  })
})

describe('createLocalStorageStore', () => {
  it('namespaces keys and survives corrupted values', async () => {
    const backing = new Map<string, string>()
    const store = createLocalStorageStore('demo:v1', {
      getItem: (key) => backing.get(key) ?? null,
      setItem: (key, value) => void backing.set(key, value),
      removeItem: (key) => void backing.delete(key),
    })
    await store.write('orders', [1])
    expect([...backing.keys()]).toEqual(['demo:v1:orders'])
    backing.set('demo:v1:orders', '{broken')
    expect(await store.read('orders')).toBeUndefined()
  })
})
