import { describe, expect, it, vi } from 'vitest'

import { withOrderOperation } from './order-operation'

describe('order operations', () => {
  it('waits for an operation on the same order before starting the next', async () => {
    let release!: () => void
    const blocked = new Promise<void>((resolve) => { release = resolve })
    const second = vi.fn()
    const first = withOrderOperation('same-order', () => blocked)
    const next = withOrderOperation('same-order', async () => second())
    await withOrderOperation('other-order', async () => undefined)
    expect(second).not.toHaveBeenCalled()
    release()
    await Promise.all([first, next])
    expect(second).toHaveBeenCalledOnce()
  })

  it('continues processing an order after a failed operation', async () => {
    const failed = withOrderOperation('failed-order', async () => { throw new Error('failed') })
    const next = withOrderOperation('failed-order', async () => 'done')
    await expect(failed).rejects.toThrow('failed')
    await expect(next).resolves.toBe('done')
  })
})