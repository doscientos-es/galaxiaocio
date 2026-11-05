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

  return useMemo(() => {
    // Keep legacy entries in storage, but do not offer unconfigured agencies or their tariffs.
    const carriers = carrierList.filter((carrier) => carrier.hasAccount)
    const carrierIds = new Set(carriers.map((carrier) => carrier.id))
    return {
      carriers,
      tariffs: tariffList.filter((tariff) => carrierIds.has(tariff.carrierId)),
      shipments: shipmentList,
      shipmentFor: (orderId: string) => shipmentList.find((item) => item.orderId === orderId),
      carrierForShipment: (carrierId: string) => carrierList.find((item) => item.id === carrierId),
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
    }
  }, [
    carrierList,
    tariffList,
    shipmentList,
    saveShipment,
    saveCarrier,
    saveTariff,
    removeTariff,
    deleteCarrier,
  ])
}
