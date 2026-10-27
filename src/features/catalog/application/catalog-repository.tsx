import { createRepositoryContext } from '@/shared/lib/data/repository-context'
import type { Collection } from '@/shared/lib/storage/collection'

import type { Product } from './product'

/** Persistence port of the catalog feature. */
export interface CatalogRepository {
  products: Collection<Product>
}

export const [CatalogProvider, useCatalogRepository] =
  createRepositoryContext<CatalogRepository>('catálogo')
