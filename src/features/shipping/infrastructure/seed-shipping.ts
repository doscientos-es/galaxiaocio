import type { Carrier, Shipment, Tariff, ServiceKind, Zone } from '../application/carrier'
import { quoteShipment } from '../application/quote'
import { buildShipment } from '../application/shipment'

const carrier = (
  id: string,
  name: string,
  portalUrl: string,
  hasAccount: boolean,
  notes: string,
): Carrier => ({ id, name, portalUrl, hasAccount, notes })

/** Demo data: carriers named in the discovery meetings. Accounts and tariffs are examples. */
export function createSeedCarriers(): Carrier[] {
  return [
    carrier('mrw', 'MRW', 'https://www.mrw.es', true, 'Paquetería pequeña nacional y Portugal'),
    carrier('ups', 'UPS', 'https://www.ups.com/es', true, 'Paquetería pequeña internacional'),
    carrier(
      'palibex',
      'Palibex',
      'https://www.palibex.es',
      true,
      'Paquetes de menos de 2 m y palés',
    ),
    carrier(
      'schenker',
      'DB Schenker',
      'https://www.dbschenker.com/es-es',
      true,
      'Grandes volúmenes nacionales e internacionales',
    ),
    carrier(
      'redur',
      'Redur',
      'https://www.redur.es',
      false,
      'Palés europeos 120 × 80 · alta de cuenta pendiente',
    ),
  ]
}

type TariffRow = [carrier: string, service: ServiceKind, zone: Zone, maxKg: number, formula: string]

/** Example formulas: a fixed fee plus a price per kg, with a few variations to show what is possible. */
const rows: TariffRow[] = [
  ['mrw', 'parcel', 'es-peninsula', 40, '4,9 + 0,18 * ceil(kg)'],
  ['mrw', 'parcel', 'portugal', 40, '7,9 + 0,35 * ceil(kg)'],
  ['mrw', 'parcel', 'es-islands', 40, '12,5 + 0,65 * ceil(kg)'],
  ['ups', 'parcel', 'es-peninsula', 40, '5,6 + 0,16 * ceil(kg)'],
  ['ups', 'parcel', 'portugal', 40, '8,4 + 0,3 * ceil(kg)'],
  ['ups', 'parcel', 'europe', 40, '(14 + 0,55 * ceil(kg)) * 1,08'],
  ['ups', 'parcel', 'es-islands', 40, '13,5 + 0,6 * ceil(kg)'],
  ['palibex', 'parcel', 'es-peninsula', 40, '7,2 + 0,14 * ceil(kg)'],
  ['palibex', 'pallet', 'es-peninsula', 600, '38 + 0,05 * ceil(kg)'],
  ['palibex', 'pallet', 'portugal', 600, '62 + 0,08 * ceil(kg)'],
  ['schenker', 'pallet', 'es-peninsula', 1000, '44 + 0,04 * ceil(kg)'],
  ['schenker', 'pallet', 'portugal', 1000, '70 + 0,07 * ceil(kg)'],
  ['schenker', 'pallet', 'europe', 1000, '120 + 0,12 * ceil(kg)'],
  ['schenker', 'pallet', 'es-islands', 1000, 'max(160; 0,2 * kg + 120)'],
  ['redur', 'pallet', 'es-peninsula', 800, '34 + 0,05 * ceil(kg)'],
  ['redur', 'pallet', 'portugal', 800, '52 + 0,06 * ceil(kg)'],
  ['redur', 'pallet', 'europe', 800, 'max(98; 60 + 0,1 * ceil(kg))'],
]

export function createSeedTariffs(): Tariff[] {
  return rows.map(([carrierId, service, zone, maxWeightKg, formula]) => ({
    id: `${carrierId}-${service}-${zone}`,
    carrierId,
    service,
    zone,
    maxWeightKg,
    formula,
  }))
}

/** The closed demo order (4 GN containers, 12 kg to Bilbao) already has its shipment. */
export function createSeedShipments(now: Date = new Date()): Shipment[] {
  const carriers = createSeedCarriers()
  const quote = quoteShipment(
    { postalCode: '48009', country: 'ES' },
    12,
    carriers,
    createSeedTariffs(),
  )
  if (!quote.recommended) return []
  return [
    {
      ...buildShipment({
        orderId: 'ord-seed-6',
        quote,
        choice: { kind: 'quoted', option: quote.recommended },
        costCents: quote.recommended.priceCents,
        trackingNumber: 'MRW-0048213377',
        now: new Date(now.getTime() - 96 * 3_600_000),
      }),
      id: 'shp-seed-6',
    },
  ]
}
