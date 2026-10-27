import { describe, expect, it } from 'vitest'

import { createSeedTariffs } from '../infrastructure/seed-shipping'
import {
  previewFormula,
  toCarrier,
  toTariff,
  validateCarrier,
  validateTariff,
  type TariffDraft,
} from './tariff-form'

const draft: TariffDraft = {
  carrierId: 'mrw',
  service: 'parcel',
  zone: 'europe',
  maxWeightKg: '30,5',
  formula: ' 6 + 0,2 * ceil(kg) ',
}

describe('tariff form', () => {
  it('accepts a valid tariff and converts it', () => {
    expect(validateTariff(draft, createSeedTariffs())).toEqual({})
    expect(toTariff(draft, 'x')).toEqual({
      id: 'x',
      carrierId: 'mrw',
      service: 'parcel',
      zone: 'europe',
      maxWeightKg: 30.5,
      formula: '6 + 0,2 * ceil(kg)',
    })
  })

  it('reports the problem next to each field', () => {
    const errors = validateTariff(
      { ...draft, carrierId: '', maxWeightKg: '0', formula: '5 + peso' },
      [],
    )
    expect(Object.keys(errors).sort()).toEqual(['carrierId', 'formula', 'maxWeightKg'])
    expect(errors.formula).toMatch(/no existe/)
  })

  it('does not allow two tariffs for the same agency, service and zone', () => {
    const errors = validateTariff({ ...draft, zone: 'es-peninsula' }, createSeedTariffs())
    expect(errors.formula).toMatch(/Ya existe/)
  })

  it('previews what a formula charges, and nothing when it is broken', () => {
    expect(previewFormula('2 + 0,5 * kg', 10)).toBe('7,00 €')
    expect(previewFormula('2 +', 10)).toBeUndefined()
  })

  it('validates and converts an agency', () => {
    expect(
      validateCarrier({ name: 'A', portalUrl: 'mrw.es', hasAccount: true, notes: '' }),
    ).toEqual({
      name: 'Indica el nombre de la agencia.',
      portalUrl: 'Indica una web que empiece por https://',
    })
    const carrier = toCarrier(
      { name: ' Seur ', portalUrl: ' https://www.seur.com ', hasAccount: false, notes: '' },
      'seur',
    )
    expect(carrier).toMatchObject({ id: 'seur', name: 'Seur', portalUrl: 'https://www.seur.com' })
  })
})
