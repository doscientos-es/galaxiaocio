import { describe, expect, it } from 'vitest'

import { createSeedCarriers, createSeedTariffs } from '../infrastructure/seed-shipping'
import { packagesFor, quoteShipment, serviceFor, zoneFor } from './quote'
import { buildShipment } from './shipment'

const carriers = createSeedCarriers()
const tariffs = createSeedTariffs()
const madrid = { postalCode: '28013', country: 'ES' }

describe('zoneFor and serviceFor', () => {
  it('maps destinations to tariff zones', () => {
    expect(zoneFor(madrid)).toBe('es-peninsula')
    expect(zoneFor({ postalCode: '07014', country: 'ES' })).toBe('es-islands')
    expect(zoneFor({ postalCode: '4000', country: 'PT' })).toBe('portugal')
    expect(zoneFor({ postalCode: '10001', country: 'US' })).toBeUndefined()
  })

  it('switches from parcel to pallet above 40 kg', () => {
    expect(serviceFor(40)).toBe('parcel')
    expect(serviceFor(41)).toBe('pallet')
    expect(packagesFor(85, 'parcel')).toBe(3)
    expect(packagesFor(85, 'pallet')).toBe(1)
  })
})

describe('quoteShipment', () => {
  it('recommends the cheapest carrier the team has an account with', () => {
    const quote = quoteShipment(madrid, 60, carriers, tariffs)
    const cheapest = quote.options[0]
    expect(cheapest?.carrier.id).toBe('redur')
    expect(cheapest?.carrier.hasAccount).toBe(false)
    expect(quote.recommended?.carrier.id).toBe('palibex')
  })

  it('orders options by price and uses the dearest as the saving reference', () => {
    const quote = quoteShipment(madrid, 12, carriers, tariffs)
    const prices = quote.options.map((option) => option.priceCents)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
    expect(quote.reference?.priceCents).toBe(prices.at(-1))
  })

  it('uses the formulas the team writes to pick the best option', () => {
    const edited = tariffs.map((tariff) =>
      tariff.id === 'schenker-pallet-es-peninsula'
        ? { ...tariff, formula: '10 + 0,01 * kg' }
        : tariff,
    )
    const quote = quoteShipment(madrid, 60, carriers, edited)
    expect(quote.recommended?.carrier.id).toBe('schenker')
    expect(quote.recommended?.priceCents).toBe(1060)
  })

  it('applies weight limits and the number of packages from the formula', () => {
    const custom = [
      {
        id: 't1',
        carrierId: 'mrw',
        service: 'parcel',
        zone: 'es-peninsula',
        maxWeightKg: 20,
        formula: '5 * bultos',
      },
      {
        id: 't2',
        carrierId: 'ups',
        service: 'parcel',
        zone: 'es-peninsula',
        maxWeightKg: 40,
        formula: '8',
      },
    ] as const
    expect(quoteShipment(madrid, 15, carriers, [...custom]).recommended?.carrier.id).toBe('mrw')
    // Over 20 kg MRW no longer accepts the shipment, so the next option wins.
    expect(quoteShipment(madrid, 30, carriers, [...custom]).recommended?.carrier.id).toBe('ups')
  })

  it('ignores a tariff whose formula is broken instead of quoting a wrong price', () => {
    const broken = tariffs.map((tariff) =>
      tariff.id === 'palibex-pallet-es-peninsula' ? { ...tariff, formula: '38 +' } : tariff,
    )
    const quote = quoteShipment(madrid, 60, carriers, broken)
    expect(quote.options.map((option) => option.carrier.id)).not.toContain('palibex')
    expect(quote.recommended?.carrier.id).toBe('schenker')
  })

  it('returns no options for an unsupported destination so a person decides', () => {
    const quote = quoteShipment({ postalCode: '10001', country: 'US' }, 20, carriers, tariffs)
    expect(quote.options).toEqual([])
    expect(quote.recommended).toBeUndefined()
  })
})

describe('buildShipment', () => {
  const quote = quoteShipment(madrid, 12, carriers, tariffs)
  const now = new Date('2026-10-27T10:00:00Z')

  it('records the saving against the most expensive option', () => {
    const option = quote.recommended
    if (!option || !quote.reference) throw new Error('Expected quoted options')
    const shipment = buildShipment({
      orderId: 'o1',
      quote,
      choice: { kind: 'quoted', option },
      costCents: option.priceCents,
      trackingNumber: ' ABC ',
      now,
    })
    expect(shipment).toMatchObject({ mode: 'recommended', trackingNumber: 'ABC' })
    expect(shipment.savedCents).toBe(quote.reference.priceCents - option.priceCents)
  })

  it('marks manual choices without any saving', () => {
    const carrier = carriers[0]
    if (!carrier) throw new Error('Expected a carrier')
    const shipment = buildShipment({
      orderId: 'o1',
      quote,
      choice: { kind: 'manual', carrier },
      costCents: 1500,
      trackingNumber: 'X',
      now,
    })
    expect(shipment).toMatchObject({ mode: 'manual', savedCents: 0 })
  })
})
