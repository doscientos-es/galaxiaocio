import type { Product, StockLine } from '@/features/catalog'
import { createId } from '@/shared/lib/ids'

import type { Carrier, Shipment } from './carrier'
import { packagesFor, type QuoteOption, type QuoteResult } from './quote'

export function totalWeightKg(lines: StockLine[], products: Product[]): number {
  return lines.reduce((sum, line) => {
    const product = products.find((candidate) => candidate.sku === line.sku)
    return sum + (product ? product.weightKg * line.quantity : 0)
  }, 0)
}

export type ShipmentChoice =
  | { kind: 'quoted'; option: QuoteOption }
  | { kind: 'manual'; carrier: Carrier }

interface ShipmentInput {
  orderId: string
  quote: QuoteResult
  choice: ShipmentChoice
  costCents: number
  trackingNumber: string
  now: Date
}

/** Saves what really happened: carrier, real cost and tracking, plus the saving versus the reference. */
export function buildShipment({
  orderId,
  quote,
  choice,
  costCents,
  trackingNumber,
  now,
}: ShipmentInput): Shipment {
  const quoted = choice.kind === 'quoted' ? choice.option : undefined
  const carrier = choice.kind === 'quoted' ? choice.option.carrier : choice.carrier
  const mode = !quoted
    ? 'manual'
    : quoted.tariff.id === quote.recommended?.tariff.id
      ? 'recommended'
      : 'alternative'
  return {
    id: createId('shp'),
    orderId,
    carrierId: carrier.id,
    carrierName: carrier.name,
    service: quote.service,
    mode,
    costCents,
    savedCents: quoted && quote.reference ? Math.max(0, quote.reference.priceCents - costCents) : 0,
    trackingNumber: trackingNumber.trim(),
    packages: packagesFor(quote.weightKg, quote.service),
    weightKg: quote.weightKg,
    createdAt: now.toISOString(),
  }
}
