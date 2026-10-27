import type { Collection } from '@/shared/lib/storage/collection'

import { buildDocuments, type BillableOrder } from './billing'
import type { BillingDocument } from './document'

/**
 * Issues the documents of an order exactly once. Numbering continues from what is already
 * saved, and calling it again for the same order returns the existing documents.
 */
export function issueDocumentsOnce(
  documents: Collection<BillingDocument>,
  order: BillableOrder,
  now: Date,
): Promise<BillingDocument[]> {
  return documents.mutate((saved) => {
    const existing = saved.filter((item) => item.orderId === order.orderId)
    if (existing.length > 0) return { items: saved, result: existing }
    const created = buildDocuments(order, saved, now)
    return { items: [...created, ...saved], result: created }
  })
}
