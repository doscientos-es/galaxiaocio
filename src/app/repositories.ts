import { createLocalBillingRepository } from '@/features/billing'
import { createLocalCatalogRepository } from '@/features/catalog'
import { createLocalOrdersRepository } from '@/features/orders'
import { createLocalShippingRepository } from '@/features/shipping'
import { createLocalStorageStore } from '@/shared/lib/storage/local-storage-store'

/**
 * Composition root of the data layer. To connect a real backend, replace the
 * `createLocal…Repository` factories below with implementations of the same ports.
 */
const store = createLocalStorageStore('galaxiaocio-demo:v1')

export const repositories = {
  catalog: createLocalCatalogRepository(store),
  orders: createLocalOrdersRepository(store),
  shipping: createLocalShippingRepository(store),
  billing: createLocalBillingRepository(store),
}

/** Restores every collection to its initial demo data. */
export async function resetDemoData(): Promise<void> {
  const { catalog, orders, shipping, billing } = repositories
  await Promise.all(
    [
      catalog.products,
      orders.orders,
      orders.customers,
      orders.activity,
      shipping.carriers,
      shipping.tariffs,
      shipping.shipments,
      billing.documents,
    ].map((collection) => collection.reset()),
  )
}
