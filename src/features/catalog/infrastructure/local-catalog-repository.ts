import { createStoredCollection } from '@/shared/lib/storage/collection'
import type { KeyValueStore } from '@/shared/lib/storage/key-value-store'

import type { CatalogRepository } from '../application/catalog-repository'
import { productSchema } from '../application/product'
import { createSeedProducts } from './seed-products'

export function createLocalCatalogRepository(store: KeyValueStore): CatalogRepository {
  return {
    products: createStoredCollection({
      store,
      key: 'products',
      schema: productSchema,
      seed: createSeedProducts,
    }),
  }
}
