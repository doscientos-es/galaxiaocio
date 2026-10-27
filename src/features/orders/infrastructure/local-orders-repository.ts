import { createStoredCollection } from '@/shared/lib/storage/collection'
import type { KeyValueStore } from '@/shared/lib/storage/key-value-store'

import { activitySchema, customerSchema, orderSchema } from '../application/order'
import type { OrdersRepository } from '../application/orders-repository'
import { createSampleIncomingSource } from './sample-intakes'
import { createSeedActivity, createSeedCustomers, createSeedOrders } from './seed-orders'

export function createLocalOrdersRepository(store: KeyValueStore): OrdersRepository {
  return {
    orders: createStoredCollection({
      store,
      key: 'orders',
      schema: orderSchema,
      seed: () => createSeedOrders(),
    }),
    customers: createStoredCollection({
      store,
      key: 'customers',
      schema: customerSchema,
      seed: () => createSeedCustomers(),
    }),
    activity: createStoredCollection({
      store,
      key: 'activity',
      schema: activitySchema,
      seed: () => createSeedActivity(),
    }),
    incoming: createSampleIncomingSource(),
  }
}
