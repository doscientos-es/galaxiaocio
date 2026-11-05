import { createRepositoryContext } from '@/shared/lib/data/repository-context'
import type { Collection } from '@/shared/lib/storage/collection'

import type { BillingDocument } from './document'
import type { Expense } from './expense'

/** Persistence port of the billing feature. */
export interface BillingRepository {
  documents: Collection<BillingDocument>
  expenses: Collection<Expense>
}

export const [BillingProvider, useBillingRepository] =
  createRepositoryContext<BillingRepository>('administración')
