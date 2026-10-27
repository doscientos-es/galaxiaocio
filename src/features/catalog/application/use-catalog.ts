import { useCollection } from '@/shared/lib/data/use-collection'

import { useCatalogRepository } from './catalog-repository'
import { reserveFromCollection, restockInCollection } from './reserve'
import type { StockLine, SupplierStatus } from './stock'

export function useCatalog() {
  const repository = useCatalogRepository()
  const { items, isLoading, upsert, upsertMany, refresh } = useCollection(
    'products',
    repository.products,
  )

  return {
    products: items,
    isLoading,
    saveProduct: upsert,
    saveProducts: upsertMany,
    /** Reserves stock atomically; throws `InsufficientStockError` if another order took it. */
    reserve: async (lines: StockLine[], supplierStatus: SupplierStatus) => {
      try {
        await reserveFromCollection(repository.products, lines, supplierStatus)
      } finally {
        await refresh()
      }
    },
    restock: async (sku: string, quantity: number) => {
      const product = await restockInCollection(repository.products, sku, quantity)
      await refresh()
      return product
    },
  }
}
