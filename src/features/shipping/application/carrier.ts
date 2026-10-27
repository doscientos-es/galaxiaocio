import { z } from 'zod'

export const zoneSchema = z.enum(['es-peninsula', 'es-islands', 'portugal', 'europe'])
export const serviceSchema = z.enum(['parcel', 'pallet'])

export const carrierSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Carrier website opened when the recommended option is accepted. */
  portalUrl: z.string(),
  /** Whether the team already has an account with this carrier. */
  hasAccount: z.boolean(),
  notes: z.string(),
})

export const tariffSchema = z.object({
  id: z.string(),
  carrierId: z.string(),
  service: serviceSchema,
  zone: zoneSchema,
  /** Heaviest shipment this tariff accepts. */
  maxWeightKg: z.number().positive(),
  /** Price in euros written by the team, e.g. `4,9 + 0,18 * ceil(kg)`. See `formula.ts`. */
  formula: z.string().min(1),
})

export const shipmentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  carrierId: z.string(),
  carrierName: z.string(),
  service: serviceSchema,
  /** recommended: cheapest with account · alternative: another quoted option · manual: special case */
  mode: z.enum(['recommended', 'alternative', 'manual']),
  costCents: z.number().int(),
  /** Difference with the most expensive quoted option; 0 for manual shipments. */
  savedCents: z.number().int(),
  trackingNumber: z.string(),
  packages: z.number().int().min(1),
  weightKg: z.number(),
  createdAt: z.string(),
})

export type Zone = z.infer<typeof zoneSchema>
export type ServiceKind = z.infer<typeof serviceSchema>
export type Carrier = z.infer<typeof carrierSchema>
export type Tariff = z.infer<typeof tariffSchema>
export type Shipment = z.infer<typeof shipmentSchema>

export const zoneLabels: Record<Zone, string> = {
  'es-peninsula': 'España peninsular',
  'es-islands': 'Islas y plazas especiales',
  portugal: 'Portugal',
  europe: 'Resto de Europa',
}

export const serviceLabels: Record<ServiceKind, string> = {
  parcel: 'Paquetería',
  pallet: 'Palé',
}
