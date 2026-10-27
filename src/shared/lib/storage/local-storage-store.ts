import type { KeyValueStore } from './key-value-store'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** Persists JSON values in the browser, namespaced so the demo never collides with other apps. */
export function createLocalStorageStore(
  namespace: string,
  storage: StorageLike = window.localStorage,
): KeyValueStore {
  const scoped = (key: string) => `${namespace}:${key}`
  return {
    read: (key) => {
      const raw = storage.getItem(scoped(key))
      if (raw === null) return Promise.resolve(undefined)
      try {
        return Promise.resolve(JSON.parse(raw) as unknown)
      } catch {
        return Promise.resolve(undefined)
      }
    },
    write: (key, value) => {
      storage.setItem(scoped(key), JSON.stringify(value))
      return Promise.resolve()
    },
    remove: (key) => {
      storage.removeItem(scoped(key))
      return Promise.resolve()
    },
  }
}
