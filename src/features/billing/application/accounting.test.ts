import { describe, expect, it } from 'vitest'

import { buildDocuments } from './billing'
import { accountingExport, accountingFor, periodFor } from './accounting'
import type { Expense } from './expense'

const expense = (date: string, netCents: number, vatCents: number): Expense => ({
  id: date, date, netCents, vatCents, description: '=SUM(1)', supplier: 'Proveedor', source: 'manual', reference: '',
})
const documents = (date: Date) => buildDocuments({
  orderId: 'o1', reference: 'PED-1', customerName: 'Cliente', customerTaxId: '', marketplace: null,
  lines: [{ description: 'Producto', quantity: 1, unitCents: 10000 }],
}, [], date)

describe('accounting', () => {
  it('uses complete calendar months and quarters across year boundaries', () => {
    const now = new Date(2027, 0, 15)
    expect(periodFor(now, 'month', -1)).toMatchObject({ start: '2026-12-01', end: '2027-01-01' })
    expect(periodFor(now, 'quarter', -1)).toMatchObject({ start: '2026-10-01', end: '2027-01-01' })
  })

  it('counts only invoices once, separates VAT and excludes dates outside the period', () => {
    const period = periodFor(new Date(2027, 0, 15), 'quarter', -1)
    const docs = [...documents(new Date(2026, 11, 10, 12)), ...documents(new Date(2027, 0, 1, 12))]
    const costs = [expense('2026-10-01', 3000, 630), expense('2027-01-01', 9999, 0)]
    expect(accountingFor(docs, costs, period)).toMatchObject({
      income: 10000, expenditure: 3000, profit: 7000, outputVat: 2100, inputVat: 630, vatBalance: 1470,
    })
  })

  it('exports only the selected period and neutralises spreadsheet formulas', () => {
    const period = periodFor(new Date(2027, 0, 15), 'month', -1)
    const file = accountingExport(documents(new Date(2026, 11, 1, 12)), [expense('2026-12-30', 1000, 210), expense('2027-01-01', 700, 0)], period)
    expect(file.content).toContain("'=SUM(1)")
    expect(file.content).toContain('10,00;2,10;12,10')
    expect(file.content).not.toContain('2027-01-01')
    expect(file.content).not.toContain('Albarán')
  })
})