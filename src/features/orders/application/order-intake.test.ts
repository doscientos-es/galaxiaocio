import { describe, expect, it } from 'vitest'

import { createOrder } from './order-workflow'
import { mockExtractExample, mockExtractText } from './order-intake'
import { orderSchema } from './order'

describe('simulated order intake', () => {
  it('extracts labelled fields without claiming an unknown SKU belongs to the catalogue', () => {
    const text = 'Amazon\nN.º de pedido: 123\nNombre del comprador: Alex\nPaís: España\nProducto: Fregadero\nSKU: EX-1\nASIN: ASIN-1\nCantidad: 2\nPrecio unitario: 220,00\nTotal del artículo: 440,00\nEstado: Nuevo'
    const draft = mockExtractText(text, [])
    expect(draft.marketplace).toBe('amazon')
    expect(draft.source).toMatchObject({ reference: '123', buyer: 'Alex', originalText: text })
    expect(draft.address.country).toBe('ES')
    expect(draft.lines[0]).toMatchObject({ sku: '', originalSku: 'EX-1', originalAsin: 'ASIN-1', originalPrice: '220,00', originalTotal: '440,00', originalState: 'Nuevo', quantity: 2 })
  })

  it('uses the same example for either input and preserves only the supplied text', () => {
    const photo = mockExtractExample([])
    const text = mockExtractExample([], 'Otro pedido')
    expect(photo.customer.name).toBe('Antonio Rodríguez Martín')
    expect(photo.source).toMatchObject({ reference: '406-2275987-2836318', seller: 'Gasfrit' })
    expect(photo.source?.originalText).toBeUndefined()
    expect(text.source?.originalText).toBe('Otro pedido')
    expect(text.lines[0]).toMatchObject({ sku: '', originalSku: 'Q0-QM5K-G2HR', originalAsin: 'B0G3XL3XR3', originalTotal: '220,00' })
  })

  it('keeps source details when saved and accepts older orders without them', () => {
    const draft = mockExtractText('Pedido: EXT-1\nCliente: Alex\nSKU: EX-1', [])
    const order = createOrder({ ...draft, channel: 'manual', whatsappPhoto: null, notes: '' }, {
      sequence: 1, now: new Date('2026-01-01T00:00:00Z'), knownSkus: new Set(),
    })
    expect(orderSchema.parse(order).source?.reference).toBe('EXT-1')
    const { source: _source, ...oldOrder } = order
    expect(orderSchema.safeParse(oldOrder).success).toBe(true)
  })
})