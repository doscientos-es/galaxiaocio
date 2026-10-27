import { createId } from '@/shared/lib/ids'

import type { Carrier, ServiceKind, Tariff, Zone } from './carrier'
import { evaluateFormula } from './formula'

export interface TariffDraft {
  carrierId: string
  service: ServiceKind
  zone: Zone
  maxWeightKg: string
  formula: string
}

export interface CarrierDraft {
  name: string
  portalUrl: string
  hasAccount: boolean
  notes: string
}

export type FormErrors<Keys extends string> = Partial<Record<Keys, string>>

const isUrl = (value: string): boolean => /^https?:\/\/\S+\.\S+/.test(value.trim())
const toNumber = (value: string): number => Number(value.trim().replace(',', '.'))

/** Preview of what a formula charges, so a typo is noticed before it reaches a real shipment. */
export function previewFormula(formula: string, kg: number): string | undefined {
  const result = evaluateFormula(formula, { kg, bultos: 1 })
  return result.ok ? `${result.value.toFixed(2).replace('.', ',')} €` : undefined
}

export function validateTariff(
  draft: TariffDraft,
  others: Tariff[],
): FormErrors<'carrierId' | 'maxWeightKg' | 'formula'> {
  const errors: FormErrors<'carrierId' | 'maxWeightKg' | 'formula'> = {}
  if (!draft.carrierId) errors.carrierId = 'Elige la agencia.'
  const max = toNumber(draft.maxWeightKg)
  if (!Number.isFinite(max) || max <= 0) errors.maxWeightKg = 'Indica un peso máximo mayor que 0.'
  const result = evaluateFormula(draft.formula, { kg: 10, bultos: 1 })
  if (!result.ok) errors.formula = result.error
  else if (
    others.some(
      (tariff) =>
        tariff.carrierId === draft.carrierId &&
        tariff.service === draft.service &&
        tariff.zone === draft.zone,
    )
  ) {
    errors.formula = 'Ya existe una tarifa de esta agencia para ese servicio y zona. Edítala.'
  }
  return errors
}

export function toTariff(draft: TariffDraft, id?: string): Tariff {
  return {
    id: id ?? createId('tar'),
    carrierId: draft.carrierId,
    service: draft.service,
    zone: draft.zone,
    maxWeightKg: toNumber(draft.maxWeightKg),
    formula: draft.formula.trim(),
  }
}

export function validateCarrier(draft: CarrierDraft): FormErrors<'name' | 'portalUrl'> {
  const errors: FormErrors<'name' | 'portalUrl'> = {}
  if (draft.name.trim().length < 2) errors.name = 'Indica el nombre de la agencia.'
  if (!isUrl(draft.portalUrl)) errors.portalUrl = 'Indica una web que empiece por https://'
  return errors
}

export function toCarrier(draft: CarrierDraft, id?: string): Carrier {
  return {
    id: id ?? createId('car'),
    name: draft.name.trim(),
    portalUrl: draft.portalUrl.trim(),
    hasAccount: draft.hasAccount,
    notes: draft.notes.trim(),
  }
}
