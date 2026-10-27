import type { Carrier, ServiceKind, Tariff, Zone } from './carrier'
import { evaluateFormula } from './formula'

export const PARCEL_MAX_KG = 40

const islandPrefixes = ['07', '35', '38', '51', '52']
const europeanCountries = new Set(['FR', 'DE', 'IT', 'NL', 'BE', 'AT', 'IE', 'LU'])

export interface Destination {
  postalCode: string
  country: string
}

export interface QuoteOption {
  carrier: Carrier
  tariff: Tariff
  priceCents: number
}

export interface QuoteResult {
  zone: Zone | undefined
  service: ServiceKind
  weightKg: number
  /** Eligible options, cheapest first. */
  options: QuoteOption[]
  /** Cheapest option among carriers the team already has an account with. */
  recommended: QuoteOption | undefined
  /** Most expensive eligible option: the reference to measure savings against. */
  reference: QuoteOption | undefined
}

export function zoneFor({ postalCode, country }: Destination): Zone | undefined {
  if (country === 'PT') return 'portugal'
  if (europeanCountries.has(country)) return 'europe'
  if (country !== 'ES') return undefined
  return islandPrefixes.includes(postalCode.trim().slice(0, 2)) ? 'es-islands' : 'es-peninsula'
}

export const serviceFor = (weightKg: number): ServiceKind =>
  weightKg <= PARCEL_MAX_KG ? 'parcel' : 'pallet'

export const packagesFor = (weightKg: number, service: ServiceKind): number =>
  service === 'pallet' ? 1 : Math.max(1, Math.ceil(weightKg / PARCEL_MAX_KG))

/**
 * Price of a tariff for a shipment, in cents. Returns `undefined` when the team's formula
 * cannot be calculated, so a broken formula never produces a wrong price.
 */
export function tariffPrice(
  tariff: Pick<Tariff, 'formula'>,
  weightKg: number,
  packages: number,
): number | undefined {
  const result = evaluateFormula(tariff.formula, { kg: weightKg, bultos: packages })
  return result.ok ? Math.round(result.value * 100) : undefined
}

/**
 * Calculates the transport options from destination, weight and tariffs.
 * Without eligible options the caller must fall back to a manual review.
 */
export function quoteShipment(
  destination: Destination,
  weightKg: number,
  carriers: Carrier[],
  tariffs: Tariff[],
): QuoteResult {
  return quoteForZone(zoneFor(destination), weightKg, carriers, tariffs)
}

/** Same as {@link quoteShipment} when the zone is already known (e.g. the simulator). */
export function quoteForZone(
  zone: Zone | undefined,
  weightKg: number,
  carriers: Carrier[],
  tariffs: Tariff[],
): QuoteResult {
  const service = serviceFor(weightKg)
  const packages = packagesFor(weightKg, service)
  const options = tariffs
    .flatMap((tariff) => {
      const carrier = carriers.find((candidate) => candidate.id === tariff.carrierId)
      const eligible =
        carrier &&
        zone === tariff.zone &&
        service === tariff.service &&
        weightKg <= tariff.maxWeightKg
      const priceCents = eligible ? tariffPrice(tariff, weightKg, packages) : undefined
      return carrier && priceCents !== undefined ? [{ carrier, tariff, priceCents }] : []
    })
    .sort((a, b) => a.priceCents - b.priceCents)
  return {
    zone,
    service,
    weightKg,
    options,
    recommended: options.find((option) => option.carrier.hasAccount),
    reference: options.at(-1),
  }
}
