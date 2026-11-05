import { createRepositoryContext } from '@/shared/lib/data/repository-context'
import type { Collection } from '@/shared/lib/storage/collection'

import type { Product } from './product'
import type { Supplier } from './supplier'

/** Persistence port of the catalog feature. */
export interface CatalogRepository {
  products: Collection<Product>
  suppliers: Collection<Supplier>
}

export const [CatalogProvider, useCatalogRepository] =
  createRepositoryContext<CatalogRepository>('catálogo')
