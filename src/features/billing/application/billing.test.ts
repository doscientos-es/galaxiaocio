import { describe, expect, it } from 'vitest'

import { createStoredCollection } from '@/shared/lib/storage/collection'
import { createMemoryStore } from '@/shared/lib/storage/memory-store'

import { buildDocuments, nextDocumentNumber, type BillableOrder } from './billing'
import { documentSchema } from './document'
import { issueDocumentsOnce } from './issue-documents'

const now = new Date('2026-10-27T10:00:00Z')

const order = (marketplace: BillableOrder['marketplace']): BillableOrder => ({
  orderId: 'o1',
  reference: 'PED-2026-0001',
  customerName: 'Bar Pepe',
  customerTaxId: 'B1',
  marketplace,
  lines: [
    { description: 'Freidora', quantity: 2, unitCents: 34900 },
    { description: 'Campana', quantity: 1, unitCents: 42500 },
  ],
})

describe('buildDocuments', () => {
  it('issues a delivery note and an invoice with 21 % VAT', () => {
    const documents = buildDocuments(order(null), [], now)
    expect(documents.map((document) => document.number)).toEqual(['ALB-2026-0001', 'FAC-2026-0001'])
    expect(documents[1]).toMatchObject({ netCents: 112300, vatCents: 23583, totalCents: 135883 })
  })

  it('issues only a delivery note for Makro, whose intermediary invoices', () => {
    const documents = buildDocuments(order('makro'), [], now)
    expect(documents.map((document) => document.kind)).toEqual(['delivery_note'])
    expect(documents[0]?.note).toContain('intermediaria')
  })

  it('never duplicates the documents of an order, even when issued twice at once', async () => {
    const documents = createStoredCollection({
      store: createMemoryStore(),
      key: 'documents',
      schema: documentSchema,
      seed: () => [],
    })
    await Promise.all([
      issueDocumentsOnce(documents, order(null), now),
      issueDocumentsOnce(documents, order(null), now),
    ])
    const saved = await documents.list()
    expect(saved.map((document) => document.number).sort()).toEqual([
      'ALB-2026-0001',
      'FAC-2026-0001',
    ])
  })

  it('continues each series after existing documents', () => {
    const [first] = buildDocuments(order(null), [], now)
    if (!first) throw new Error('Expected a document')
    expect(nextDocumentNumber('delivery_note', [first], 2026)).toBe('ALB-2026-0002')
    expect(nextDocumentNumber('invoice', [first], 2026)).toBe('FAC-2026-0001')
  })
})
