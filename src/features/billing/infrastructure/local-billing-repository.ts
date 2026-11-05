import { createStoredCollection } from '@/shared/lib/storage/collection'
import type { KeyValueStore } from '@/shared/lib/storage/key-value-store'

import type { BillingRepository } from '../application/billing-repository'
import { documentSchema } from '../application/document'
import { expenseSchema } from '../application/expense'
import { createSeedDocuments } from './seed-documents'
import { createSeedExpenses } from './seed-expenses'

export function createLocalBillingRepository(store: KeyValueStore): BillingRepository {
  return {
    documents: createStoredCollection({
      store,
      key: 'documents',
      schema: documentSchema,
      seed: () => createSeedDocuments(),
    }),
    expenses: createStoredCollection({ store, key: 'expenses', schema: expenseSchema, seed: createSeedExpenses }),
  }
}
