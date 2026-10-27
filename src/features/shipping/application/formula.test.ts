import { describe, expect, it } from 'vitest'

import { evaluateFormula } from './formula'

const price = (formula: string, kg = 10, bultos = 1) => {
  const result = evaluateFormula(formula, { kg, bultos })
  return result.ok ? result.value : result.error
}

describe('evaluateFormula', () => {
  it('calculates a fixed fee plus a price per kg', () => {
    expect(price('4,9 + 0,18 * ceil(kg)', 12.2)).toBeCloseTo(4.9 + 0.18 * 13)
  })

  it('respects operator precedence, parentheses and a surcharge', () => {
    expect(price('2 + 3 * 4')).toBe(14)
    expect(price('(14 + 0,5 * kg) * 1,08', 10)).toBeCloseTo(20.52)
    expect(price('10 - -2')).toBe(12)
  })

  it('supports max, min and rounding with ; as separator', () => {
    expect(price('max(98; 60 + 0,1 * kg)', 10)).toBe(98)
    expect(price('max(98; 60 + 0,1 * kg)', 500)).toBe(110)
    expect(price('min(20; kg)', 30)).toBe(20)
    expect(price('floor(2,9) + round(2,5)')).toBe(5)
  })

  it('uses the number of packages', () => {
    expect(price('5 + 3 * bultos', 10, 4)).toBe(17)
  })

  it('accepts × and any case for names', () => {
    expect(price('2 × KG', 5)).toBe(10)
  })

  it('explains mistakes in plain language instead of throwing', () => {
    expect(price('')).toMatch(/vacía/)
    expect(price('5 + ')).toMatch(/termina/)
    expect(price('5 + peso')).toMatch(/no existe/)
    expect(price('max(1, 2)')).toMatch(/;/)
    expect(price('foo(2)')).toMatch(/función/)
    expect(price('(2 + 3')).toMatch(/Falta/)
    expect(price('2 3')).toMatch(/Sobra/)
    expect(price('ceil(1; 2)')).toMatch(/argumento/)
  })

  it('rejects results that are not a valid price', () => {
    expect(price('10 / 0')).toMatch(/válido/)
    expect(price('kg - 100', 10)).toMatch(/válido/)
  })

  it('never runs code', () => {
    expect(price('process.exit(1)')).toMatch(/Carácter no permitido/)
    expect(price('constructor')).toMatch(/no existe/)
    expect(price('alert(1)')).toMatch(/función/)
    expect(price('constructor(1)')).toMatch(/función/)
    expect(price('toString(1)')).toMatch(/función/)
  })
})
