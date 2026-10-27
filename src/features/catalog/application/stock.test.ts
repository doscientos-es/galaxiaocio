import { describe, expect, it } from 'vitest'

import { createStoredCollection } from '@/shared/lib/storage/collection'
import { createMemoryStore } from '@/shared/lib/storage/memory-store'

import { createSeedProducts } from '../infrastructure/seed-products'
import { orderTotals } from './pricing'
import { productSchema } from './product'
import { InsufficientStockError, reserveFromCollection, restockInCollection } from './reserve'
import { evaluateStock, reserveStock, restockProduct } from './stock'

const products = createSeedProducts()

const newCatalog = () =>
  createStoredCollection({
    store: createMemoryStore(),
    key: 'products',
    schema: productSchema,
    seed: createSeedProducts,
  })

describe('orderTotals', () => {
  it('prices an order at catalog prices with 21 % VAT', () => {
    const totals = orderTotals(
      [
        { sku: 'FRY-2X8', quantity: 2 },
        { sku: 'CMP-120', quantity: 1 },
      ],
      products,
    )
    expect(totals).toEqual({ netCents: 112300, vatCents: 23583, totalCents: 135883 })
  })

  it('counts unidentified items as zero until they are identified', () => {
    expect(orderTotals([{ sku: '', quantity: 3 }], products).totalCents).toBe(0)
  })
})

describe('atomic stock reservation', () => {
  it('lets only one of two competing orders take the last unit', async () => {
    const catalog = newCatalog()
    const lines = [{ sku: 'VIT-REF', quantity: 1 }]
    const results = await Promise.allSettled([
      reserveFromCollection(catalog, lines, 'none'),
      reserveFromCollection(catalog, lines, 'none'),
    ])
    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected'])
    const rejected = results.find((result) => result.status === 'rejected')
    expect(rejected?.status === 'rejected' && rejected.reason).toBeInstanceOf(
      InsufficientStockError,
    )
    expect((await catalog.get('vit-ref'))?.stock).toBe(0)
  })

  it('does not change anything when the reservation is refused', async () => {
    const catalog = newCatalog()
    const before = await catalog.list()
    await expect(
      reserveFromCollection(catalog, [{ sku: 'VIT-REF', quantity: 5 }], 'none'),
    ).rejects.toBeInstanceOf(InsufficientStockError)
    expect(await catalog.list()).toEqual(before)
  })

  it('adds restocked units to the current stock', async () => {
    const catalog = newCatalog()
    await reserveFromCollection(catalog, [{ sku: 'FRY-2X8', quantity: 2 }], 'none')
    await restockInCollection(catalog, 'FRY-2X8', 5)
    expect((await catalog.get('fry-2x8'))?.stock).toBe(9)
  })
})

describe('evaluateStock', () => {
  it('is ok when every item is available', () => {
    const result = evaluateStock([{ sku: 'FRY-2X8', quantity: 2 }], products)
    expect(result.status).toBe('ok')
  })

  it('lists exactly how many units are missing', () => {
    const result = evaluateStock([{ sku: 'VIT-REF', quantity: 3 }], products)
    expect(result.status).toBe('shortage')
    expect(result.lines[0]).toMatchObject({ available: 1, missing: 2 })
  })

  it('gives priority to the external supplier over a stock shortage', () => {
    const result = evaluateStock(
      [
        { sku: 'VIT-REF', quantity: 3 },
        { sku: 'HRN-FM6', quantity: 1 },
      ],
      products,
    )
    expect(result.status).toBe('external')
  })

  it('treats supplier items as available once the supplier has delivered', () => {
    const result = evaluateStock([{ sku: 'HRN-FM6', quantity: 1 }], products, {
      supplierReceived: true,
    })
    expect(result.status).toBe('ok')
  })

  it('flags items that are not in the catalog', () => {
    expect(evaluateStock([{ sku: '', quantity: 1 }], products).status).toBe('unknown')
  })
})

describe('reserveStock and restockProduct', () => {
  it('only reduces stock of own-stock items and never below zero', () => {
    const changed = reserveStock(products, [
      { sku: 'FRY-2X8', quantity: 2 },
      { sku: 'HRN-FM6', quantity: 1 },
      { sku: 'VIT-REF', quantity: 5 },
    ])
    expect(changed.map((product) => [product.sku, product.stock])).toEqual([
      ['FRY-2X8', 4],
      ['VIT-REF', 0],
    ])
  })

  it('adds the received units', () => {
    const vitrine = products.find((product) => product.sku === 'VIT-REF')
    expect(vitrine && restockProduct(vitrine, 4).stock).toBe(5)
  })
})
