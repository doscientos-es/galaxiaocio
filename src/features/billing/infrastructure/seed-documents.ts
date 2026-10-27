import { buildDocuments } from '../application/billing'
import type { BillingDocument } from '../application/document'

/** The closed demo order (4 × GN container pack at 49 €) already has its documents. */
export function createSeedDocuments(now: Date = new Date()): BillingDocument[] {
  const issuedAt = new Date(now.getTime() - 90 * 3_600_000)
  return buildDocuments(
    {
      orderId: 'ord-seed-6',
      reference: `PED-${now.getFullYear()}-0006`,
      customerName: 'Cafetería Aurora',
      customerTaxId: 'B99887766',
      marketplace: null,
      lines: [{ description: 'Cubeta GN 1/1 inox (pack 6)', quantity: 4, unitCents: 4900 }],
    },
    [],
    issuedAt,
  ).map((document, index) => ({ ...document, id: `doc-seed-${index + 1}` }))
}
