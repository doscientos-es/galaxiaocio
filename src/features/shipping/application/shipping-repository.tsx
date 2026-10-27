import { createRepositoryContext } from '@/shared/lib/data/repository-context'
import type { Collection } from '@/shared/lib/storage/collection'

import type { Carrier, Shipment, Tariff } from './carrier'

/** Persistence port of the shipping feature. */
export interface ShippingRepository {
  carriers: Collection<Carrier>
  tariffs: Collection<Tariff>
  shipments: Collection<Shipment>
}

export const [ShippingProvider, useShippingRepository] =
  createRepositoryContext<ShippingRepository>('transporte')
