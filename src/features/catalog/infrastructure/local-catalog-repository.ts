import { createStoredCollection } from '@/shared/lib/storage/collection'
import type { KeyValueStore } from '@/shared/lib/storage/key-value-store'

import type { CatalogRepository } from '../application/catalog-repository'
import { productSchema } from '../application/product'
import { supplierSchema } from '../application/supplier'
import { createSeedSuppliers, withExampleContacts } from './catalog-example-data'
import { createSeedProducts } from './seed-products'

export function createLocalCatalogRepository(store: KeyValueStore): CatalogRepository {
  const catalogStore = withExampleContacts(store)
  return {
    products: createStoredCollection({
      store: catalogStore,
      key: 'products',
      schema: productSchema,
      seed: createSeedProducts,
    }),
    suppliers: createStoredCollection({
      store: catalogStore,
      key: 'suppliers',
      schema: supplierSchema,
      seed: createSeedSuppliers,
    }),
  }
}
