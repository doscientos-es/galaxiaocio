import type { KeyValueStore } from './key-value-store'

/** In-memory store for tests and for running the app without a browser. */
export function createMemoryStore(): KeyValueStore {
  const values = new Map<string, unknown>()
  return {
    read: (key) => Promise.resolve(structuredClone(values.get(key))),
    write: (key, value) => {
      values.set(key, structuredClone(value))
      return Promise.resolve()
    },
    remove: (key) => {
      values.delete(key)
      return Promise.resolve()
    },
  }
}
