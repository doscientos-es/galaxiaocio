import type { Product } from '@/features/catalog'
import { createId } from '@/shared/lib/ids'

import type { Marketplace, Order, OrderSource } from './order'

export type OrderFormDraft = Pick<Order, 'customer' | 'address' | 'lines' | 'marketplace' | 'source'>

export const emptyOrderSource = (): OrderSource => ({
  reference: '',
  date: '',
  seller: '',
  buyer: '',
  shippingService: '',
  total: '',
})

export const emptyOrderDraft = (): OrderFormDraft => ({
  marketplace: null,
  source: emptyOrderSource(),
  customer: { name: '', taxId: '', email: '', phone: '' },
  address: { street: '', postalCode: '', city: '', country: 'ES' },
  lines: [{ id: createId('line'), sku: '', description: '', quantity: 1 }],
})

/** Temporary local extraction of explicitly labelled text; this is not an AI service. */
export function mockExtractText(text: string, products: Product[]): OrderFormDraft {
  const draft = emptyOrderDraft()
  const read = (labels: string) =>
    text.match(new RegExp(`^[ \\t]*(?:${labels})[ \\t]*:[ \\t]*(.+)$`, 'im'))?.[1]?.trim() ?? ''
  const sku = read('SKU')
  const match = products.find((product) => product.sku.toLowerCase() === sku.toLowerCase())
  const quantity = Number.parseInt(read('Cantidad'), 10)
  const country = read('Pa[ií]s')
  const countryCodes: Record<string, string> = {
    españa: 'ES', portugal: 'PT', francia: 'FR', alemania: 'DE', italia: 'IT',
  }
  const marketplace: Marketplace | null = /amazon/i.test(text)
    ? 'amazon'
    : /leroy\s+merlin/i.test(text)
      ? 'leroy-merlin'
      : /makro/i.test(text)
        ? 'makro'
        : null

  return {
    ...draft,
    marketplace,
    source: {
      reference: read('N[.º°]*\\s*(?:de\\s*)?pedido|Pedido'),
      date: read('Fecha(?: del pedido)?'),
      buyer: read('Nombre del comprador|Comprador'),
      seller: read('Nombre del vendedor|Vendedor'),
      shippingService: read('Servicio de env[ií]o'),
      total: read('Suma total|Total(?: del pedido)?'),
      originalText: text,
    },
    customer: {
      name: read('Destinatario|Cliente|Nombre del comprador|Comprador'),
      taxId: read('NIF|CIF'),
      email: read('Email|Correo'),
      phone: read('Tel[eé]fono'),
    },
    address: {
      street: read('Direcci[oó]n(?: de env[ií]o)?'),
      street2: read('Direcci[oó]n adicional'),
      postalCode: read('C[oó]digo postal|CP'),
      city: read('Poblaci[oó]n|Ciudad'),
      province: read('Provincia'),
      country: countryCodes[country.toLowerCase()] ?? (country.toUpperCase() || 'ES'),
    },
    lines: [{
      id: createId('line'),
      sku: match?.sku ?? '',
      description: read('Art[ií]culo|Producto|Descripci[oó]n') || match?.name || '',
      originalSku: sku,
      originalAsin: read('ASIN'),
      originalReference: read('Referencia del art[ií]culo'),
      originalPrice: read('Precio por unidad|Precio unitario'),
      originalTotal: read('Total del art[ií]culo'),
      originalState: read('Estado'),
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    }],
  }
}

/** Example returned for either intake method until the extraction service is connected. */
export function mockExtractExample(products: Product[], originalText?: string): OrderFormDraft {
  const sku = 'Q0-QM5K-G2HR'
  const match = products.find((product) => product.sku.toLowerCase() === sku.toLowerCase())
  return {
    marketplace: 'amazon',
    source: {
      reference: '406-2275987-2836318',
      date: '30/09/2026',
      seller: 'Gasfrit',
      buyer: 'Antonio',
      shippingService: 'Estándar',
      total: '220,00',
      ...(originalText === undefined ? {} : { originalText }),
    },
    customer: { name: 'Antonio Rodríguez Martín', taxId: '', email: '', phone: '' },
    address: {
      street: 'Calle Juan Jiménez Cuenca, 19 - Local Martín Inmobiliaria',
      street2: 'Calle Juan Jiménez Cuenca, 9, 3ºA',
      postalCode: '14900',
      city: 'Lucena',
      province: 'Córdoba',
      country: 'ES',
    },
    lines: [{
      id: createId('line'),
      sku: match?.sku ?? '',
      description: 'GASFRIT Fregadero Industrial Acero Inoxidable | 1 Seno con Escurridor | 800x500x850 mm | Acabado Pulido Satinado | Ideal Hostelería, Barra y Cocina Profesional (Izquierda, Grifo monomando 2 aguas)',
      originalSku: sku,
      originalAsin: 'B0G3XL3XR3',
      originalReference: '68637736709482',
      originalPrice: '220,00',
      originalTotal: '220,00',
      originalState: 'Nuevo',
      quantity: 1,
    }],
  }
}