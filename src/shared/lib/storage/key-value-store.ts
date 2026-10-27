/**
 * Minimal async persistence port. The demo ships a localStorage adapter;
 * a real backend only needs another implementation of this interface.
 */
export interface KeyValueStore {
  read(key: string): Promise<unknown>
  write(key: string, value: unknown): Promise<void>
  remove(key: string): Promise<void>
}
