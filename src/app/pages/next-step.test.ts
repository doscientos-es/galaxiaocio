import { describe, expect, it } from 'vitest'

import { nextStep } from './next-step'

const base = { stock: 'ok', supplierStatus: 'none', marketplace: null } as const

describe('nextStep', () => {
  it('asks for a review of WhatsApp photos and for missing data', () => {
    expect(nextStep({ ...base, stage: 'review' }).title).toMatch(/foto/i)
    expect(nextStep({ ...base, stage: 'incomplete' }).title).toMatch(/datos/i)
  })

  it('follows the supplier path before checking own stock', () => {
    expect(nextStep({ ...base, stage: 'stored', stock: 'external' })).toMatchObject({
      tone: 'action',
      title: 'Hay que pedir al proveedor',
    })
    expect(
      nextStep({ ...base, stage: 'stored', stock: 'external', supplierStatus: 'notified' }).tone,
    ).toBe('waiting')
  })

  it('marks a stock shortage as waiting, not as something to do now', () => {
    expect(nextStep({ ...base, stage: 'stored', stock: 'shortage' }).tone).toBe('waiting')
  })

  it('invites to prepare the shipment once stock is enough', () => {
    expect(nextStep({ ...base, stage: 'stored' }).title).toBe('Prepara la expedición')
  })

  it('explains that Makro invoices through the intermediary after shipping', () => {
    expect(nextStep({ ...base, stage: 'shipped', marketplace: 'makro' }).detail).toMatch(
      /intermediaria/,
    )
    expect(nextStep({ ...base, stage: 'closed' }).tone).toBe('done')
  })
})
