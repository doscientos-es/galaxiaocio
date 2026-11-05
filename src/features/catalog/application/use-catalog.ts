import { useCollection } from '@/shared/lib/data/use-collection'

import { useCatalogRepository } from './catalog-repository'
import type { Product } from './product'
import { reserveFromCollection, restockInCollection } from './reserve'
import { saveCatalogProduct } from './save-catalog-product'
import type { StockLine, SupplierStatus } from './stock'

export function useCatalog() {
  const repository = useCatalogRepository()
  const { items, isLoading, upsert, upsertMany, refresh } = useCollection(
    'products',
    repository.products,
  )
  const suppliers = useCollection('suppliers', repository.suppliers)

  return {
    products: items,
    suppliers: suppliers.items,
    isLoading: isLoading || suppliers.isLoading,
    saveProduct: upsert,
    saveProductDetails: async (product: Product) => {
      try {
        return await saveCatalogProduct(repository.products, product)
      } finally {
        await refresh()
      }
    },
    saveSupplier: suppliers.upsert,
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
