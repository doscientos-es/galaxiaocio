import { useCatalog } from '@/features/catalog'
import type { Order } from '@/features/orders'
import { useCollection } from '@/shared/lib/data/use-collection'

import { toBillable } from './billing'
import { useBillingRepository } from './billing-repository'
import { issueDocumentsOnce } from './issue-documents'

export function useBilling() {
  const repository = useBillingRepository()
  const { products } = useCatalog()
  const documents = useCollection('documents', repository.documents)

  return {
    documents: documents.items,
    documentsFor: (orderId: string) => documents.items.filter((item) => item.orderId === orderId),
    /**
     * Creates the delivery note and, when it applies, the invoice for a shipped order.
     * Safe to call twice: an order never gets duplicated documents, and numbering always
     * continues from the documents already saved.
     */
    issueDocuments: async (order: Order) => {
      const issued = await issueDocumentsOnce(
        repository.documents,
        toBillable(order, products),
        new Date(),
      )
      await documents.refresh()
      return issued
    },
  }
}
