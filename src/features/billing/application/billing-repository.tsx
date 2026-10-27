import { createRepositoryContext } from '@/shared/lib/data/repository-context'
import type { Collection } from '@/shared/lib/storage/collection'

import type { BillingDocument } from './document'

/** Persistence port of the billing feature. */
export interface BillingRepository {
  documents: Collection<BillingDocument>
}

export const [BillingProvider, useBillingRepository] =
  createRepositoryContext<BillingRepository>('administración')
