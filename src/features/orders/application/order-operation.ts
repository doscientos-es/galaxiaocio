const pending = new Map<string, Promise<unknown>>()

/** Serialises operations on the same order, including across tabs when Web Locks is available. */
export async function withOrderOperation<T>(orderId: string, task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return await navigator.locks.request(`galaxiaocio-demo:order:${orderId}`, task)
  }

  const previous = pending.get(orderId) ?? Promise.resolve()
  const current = previous.catch(() => undefined).then(task)
  pending.set(orderId, current)
  void current.finally(() => {
    if (pending.get(orderId) === current) pending.delete(orderId)
  }).catch(() => undefined)
  return current
}