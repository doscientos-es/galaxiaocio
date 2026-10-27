import { describe, expect, it } from 'vitest'

import { createSampleIncomingSource } from '../infrastructure/sample-intakes'
import type { Customer, IntakeDraft } from './order'
import {
  advanceOrder,
  confirmReview,
  createOrder,
  editOrder,
  findOrCreateCustomer,
} from './order-workflow'
import { validateOrder } from './validation'

const knownSkus = new Set(['FRY-2X8', 'FOG-4F', 'CMP-120', 'MES-180', 'COR-300', 'LAV-500'])
const now = new Date('2026-10-27T10:00:00Z')
const context = { sequence: 7, now, knownSkus }
const source = createSampleIncomingSource()

const complete = (): Promise<IntakeDraft> => source.fetch('web')

describe('createOrder', () => {
  it('stores a complete order from a regular channel', async () => {
    const order = createOrder(await complete(), context)
    expect(order.stage).toBe('stored')
    expect(order.reference).toBe('PED-2026-0007')
  })

  it('keeps WhatsApp photos in review until a person confirms them', async () => {
    const order = createOrder(await source.fetch('whatsapp'), context)
    expect(order.stage).toBe('review')
  })

  it('marks the order incomplete when data is missing', async () => {
    const draft = await complete()
    const order = createOrder({ ...draft, address: { ...draft.address, postalCode: '' } }, context)
    expect(order.stage).toBe('incomplete')
  })
})

describe('validation', () => {
  it('reports unidentified items by line', async () => {
    const draft = await complete()
    const lines = [...draft.lines, { id: 'x', sku: '', description: 'Carro', quantity: 1 }]
    const issues = validateOrder({ ...draft, lines }, knownSkus)
    expect(issues.map((issue) => issue.field)).toEqual(['line:x'])
  })

  it('accepts a phone when there is no email', async () => {
    const draft = await complete()
    const customer = { ...draft.customer, email: '', phone: '600 11 22 33' }
    expect(validateOrder({ ...draft, customer }, knownSkus)).toEqual([])
  })
})

describe('review and edits', () => {
  it('registers a reviewed photo only when the data is valid', async () => {
    const photo = createOrder(await source.fetch('whatsapp'), context)
    expect(confirmReview(photo, {}, knownSkus).stage).toBe('incomplete')

    const fixed = confirmReview(
      photo,
      {
        customer: { name: 'Makro Alcobendas', taxId: '', email: '', phone: '911234567' },
        lines: [{ id: 'a', sku: 'FOG-4F', description: 'Fogón', quantity: 1 }],
      },
      knownSkus,
    )
    expect(fixed.stage).toBe('stored')
  })

  it('re-validates when an incomplete order is corrected', async () => {
    const draft = await complete()
    const incomplete = createOrder({ ...draft, address: { ...draft.address, city: '' } }, context)
    const fixed = editOrder(incomplete, { address: draft.address }, knownSkus)
    expect(fixed.stage).toBe('stored')
  })

  it('does not allow editing once the order is ready', async () => {
    const ready = advanceOrder(createOrder(await complete(), context), 'ready')
    expect(() => editOrder(ready, {}, knownSkus)).toThrow()
  })
})

describe('transitions and customers', () => {
  it('only advances along the agreed flow', async () => {
    const stored = createOrder(await complete(), context)
    expect(() => advanceOrder(stored, 'shipped')).toThrow()
    expect(advanceOrder(advanceOrder(stored, 'ready'), 'shipped').stage).toBe('shipped')
  })

  it('recognises a repeat customer by tax id', async () => {
    const draft = await complete()
    const saved: Customer = { ...draft.customer, id: 'cus-1', createdAt: now.toISOString() }
    const lookup = findOrCreateCustomer({ ...draft.customer, email: 'otro@x.es' }, [saved], now)
    expect(lookup).toMatchObject({ isNew: false, customer: { id: 'cus-1' } })
  })
})
