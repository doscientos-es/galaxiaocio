import { createStoredCollection } from '@/shared/lib/storage/collection'
import type { KeyValueStore } from '@/shared/lib/storage/key-value-store'

import { carrierSchema, shipmentSchema, tariffSchema } from '../application/carrier'
import type { ShippingRepository } from '../application/shipping-repository'
import { createSeedCarriers, createSeedShipments, createSeedTariffs } from './seed-shipping'

export function createLocalShippingRepository(store: KeyValueStore): ShippingRepository {
  return {
    carriers: createStoredCollection({
      store,
      key: 'carriers',
      schema: carrierSchema,
      seed: createSeedCarriers,
    }),
    tariffs: createStoredCollection({
      store,
      key: 'tariffs',
      schema: tariffSchema,
      seed: createSeedTariffs,
    }),
    shipments: createStoredCollection({
      store,
      key: 'shipments',
      schema: shipmentSchema,
      seed: () => createSeedShipments(),
    }),
  }
}
