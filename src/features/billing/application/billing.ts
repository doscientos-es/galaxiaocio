import type { Product } from '@/features/catalog'
import type { Marketplace, Order } from '@/features/orders'
import { createId } from '@/shared/lib/ids'
import { splitVat } from '@/shared/lib/money'

import type { BillingDocument, DocumentKind } from './document'

/** What a document needs to know about an order, independent of how orders are stored. */
export interface BillableOrder {
  orderId: string
  reference: string
  customerName: string
  customerTaxId: string
  marketplace: Marketplace | null
  lines: Array<{ description: string; quantity: number; unitCents: number }>
}

const prefixes: Record<DocumentKind, string> = { delivery_note: 'ALB', invoice: 'FAC' }

export function toBillable(order: Order, products: Product[]): BillableOrder {
  return {
    orderId: order.id,
    reference: order.reference,
    customerName: order.customer.name,
    customerTaxId: order.customer.taxId,
    marketplace: order.marketplace,
    lines: order.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitCents: products.find((product) => product.sku === line.sku)?.priceCents ?? 0,
    })),
  }
}

/**
 * Orders from Makro go through an intermediary company that issues the invoice,
 * so only a delivery note is produced for them.
 */
export const documentKindsFor = (order: Pick<BillableOrder, 'marketplace'>): DocumentKind[] =>
  order.marketplace === 'makro' ? ['delivery_note'] : ['delivery_note', 'invoice']

export function nextDocumentNumber(
  kind: DocumentKind,
  existing: Pick<BillingDocument, 'kind' | 'number'>[],
  year: number,
): string {
  const used = existing
    .filter((document) => document.kind === kind)
    .map((document) => Number(document.number.split('-').at(-1)) || 0)
  return `${prefixes[kind]}-${year}-${String(Math.max(0, ...used) + 1).padStart(4, '0')}`
}

export function buildDocuments(
  order: BillableOrder,
  existing: BillingDocument[],
  now: Date,
): BillingDocument[] {
  const totals = splitVat(
    order.lines.reduce((sum, line) => sum + line.quantity * line.unitCents, 0),
  )
  const created: BillingDocument[] = []
  for (const kind of documentKindsFor(order)) {
    created.push({
      id: createId('doc'),
      number: nextDocumentNumber(kind, [...existing, ...created], now.getFullYear()),
      kind,
      orderId: order.orderId,
      orderReference: order.reference,
      customerName: order.customerName,
      customerTaxId: order.customerTaxId,
      issuedAt: now.toISOString(),
      lines: order.lines,
      ...totals,
      note:
        order.marketplace === 'makro'
          ? 'La factura la emite la entidad intermediaria de Makro.'
          : '',
    })
  }
  return created
}
