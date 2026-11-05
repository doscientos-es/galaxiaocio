import { createDemoScenarios } from '@/shared/lib/demo/seed-data'

import { buildDocuments } from '../application/billing'
import type { BillingDocument } from '../application/document'

/** The closed demo order (4 × GN container pack at 49 €) already has its documents. */
export function createSeedDocuments(now: Date = new Date()): BillingDocument[] {
  const issuedAt = new Date(now.getTime() - 90 * 3_600_000)
  const documents = buildDocuments(
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
  const closed = createDemoScenarios(now).filter((scenario) => scenario.stage === 'closed').reverse()
  for (const scenario of closed) {
    const additional = buildDocuments({
      orderId: scenario.id,
      reference: scenario.reference,
      customerName: scenario.customer.name,
      customerTaxId: scenario.customer.taxId,
      marketplace: null,
      lines: scenario.lines.map(({ description, quantity, unitCents }) => ({ description, quantity, unitCents })),
    }, documents, new Date(scenario.issuedAt))
    documents.push(...additional.map((document) => ({ ...document, id: `doc-${scenario.id}-${document.kind}` })))
  }
  return documents
}
