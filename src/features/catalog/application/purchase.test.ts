import { describe, expect, it } from 'vitest'

import { createSeedProducts } from '../infrastructure/seed-products'
import { groupMissingBySupplier, purchaseMessage, safeSupplierUrl } from './purchase'
import { evaluateStock } from './stock'

describe('supplier purchase requests', () => {
  it('groups actual shortages and external items by supplier without hiding unassigned products', () => {
    const products = createSeedProducts().map((product) =>
      product.sku === 'VIT-REF'
        ? { ...product, supplier: 'FM Industrial' }
        : product.sku === 'CMP-120'
          ? { ...product, supplier: null }
          : product,
    )
    const lines = evaluateStock(
      [
        { sku: 'VIT-REF', quantity: 2 },
        { sku: 'VIT-REF', quantity: 2 },
        { sku: 'HRN-FM6', quantity: 2 },
        { sku: 'CMP-120', quantity: 4 },
        { sku: 'FRY-2X8', quantity: 1 },
        { sku: 'UNKNOWN', quantity: 1 },
      ],
      products,
    ).lines
    const groups = groupMissingBySupplier(lines, [
      { id: 'fm industrial', name: 'FM Industrial', email: 'ventas@example.com', url: '' },
    ])
    expect(groups).toHaveLength(2)
    expect(groups[0]?.supplier?.email).toBe('ventas@example.com')
    expect(groups[0]?.lines.map(({ sku, missing }) => [sku, missing])).toEqual([
      ['VIT-REF', 3],
      ['HRN-FM6', 2],
    ])
    expect(groups[1]?.lines.map(({ sku }) => sku)).toEqual(['CMP-120', 'UNKNOWN'])
    if (!groups[0]) throw new Error('Falta el grupo de proveedor')
    expect(purchaseMessage('PED-1', groups[0])).toContain(
      '3 × Vitrina refrigerada 120 cm (VIT-REF)',
    )
    expect(purchaseMessage('PED-1', groups[0])).not.toContain('CMP-120')
  })

  it('accepts only web links with a safe protocol', () => {
    expect(safeSupplierUrl('javascript:alert(1)')).toBeUndefined()
    expect(safeSupplierUrl('https://supplier.example')).toBe('https://supplier.example/')
  })
})
