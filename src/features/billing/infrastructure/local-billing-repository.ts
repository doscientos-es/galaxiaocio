import { createStoredCollection } from '@/shared/lib/storage/collection'
import type { KeyValueStore } from '@/shared/lib/storage/key-value-store'

import type { BillingRepository } from '../application/billing-repository'
import { documentSchema } from '../application/document'
import { createSeedDocuments } from './seed-documents'

export function createLocalBillingRepository(store: KeyValueStore): BillingRepository {
  return {
    documents: createStoredCollection({
      store,
      key: 'documents',
      schema: documentSchema,
      seed: () => createSeedDocuments(),
    }),
  }
}
