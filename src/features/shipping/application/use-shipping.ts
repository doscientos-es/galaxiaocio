import { useMemo } from 'react'

import { useCollection } from '@/shared/lib/data/use-collection'

import type { Zone } from './carrier'
import { quoteForZone, quoteShipment, type Destination } from './quote'
import { useShippingRepository } from './shipping-repository'

export function useShipping() {
  const repository = useShippingRepository()
  const {
    items: carrierList,
    upsert: saveCarrier,
    remove: deleteCarrier,
  } = useCollection('carriers', repository.carriers)
  const {
    items: tariffList,
    upsert: saveTariff,
    remove: removeTariff,
  } = useCollection('tariffs', repository.tariffs)
  const { items: shipmentList, upsert: saveShipment } = useCollection(
    'shipments',
    repository.shipments,
  )

  return useMemo(
    () => ({
      carriers: carrierList,
      tariffs: tariffList,
      shipments: shipmentList,
      shipmentFor: (orderId: string) => shipmentList.find((item) => item.orderId === orderId),
      quote: (destination: Destination, weightKg: number) =>
        quoteShipment(destination, weightKg, carrierList, tariffList),
      quoteZone: (zone: Zone, weightKg: number) =>
        quoteForZone(zone, weightKg, carrierList, tariffList),
      saveShipment,
      saveCarrier,
      saveTariff,
      removeTariff,
      /** Removing a carrier also removes its tariffs; past shipments keep the carrier name. */
      removeCarrier: async (carrierId: string) => {
        const own = tariffList.filter((tariff) => tariff.carrierId === carrierId)
        await Promise.all(own.map((tariff) => removeTariff(tariff.id)))
        await deleteCarrier(carrierId)
      },
    }),
    [
      carrierList,
      tariffList,
      shipmentList,
      saveShipment,
      saveCarrier,
      saveTariff,
      removeTariff,
      deleteCarrier,
    ],
  )
}
