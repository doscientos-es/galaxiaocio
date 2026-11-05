import { toCsv } from '@/shared/lib/csv'

import type { BillingDocument } from './document'
import { localDate, type Expense } from './expense'

export type PeriodKind = 'month' | 'quarter'
export interface Period { start: string; end: string; label: string }

/** Calendar periods use an exclusive end, including across year boundaries. */
export function periodFor(now: Date, kind: PeriodKind, offset = 0): Period {
  const size = kind === 'month' ? 1 : 3
  const month = kind === 'month' ? now.getMonth() : Math.floor(now.getMonth() / 3) * 3
  const start = new Date(now.getFullYear(), month + offset * size, 1)
  const end = new Date(start.getFullYear(), start.getMonth() + size, 1)
  const label = kind === 'month'
    ? new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(start)
    : `${Math.floor(start.getMonth() / 3) + 1}.º trimestre ${start.getFullYear()}`
  return { start: localDate(start), end: localDate(end), label }
}

const within = (date: string, period: Period) => date >= period.start && date < period.end
export function accountingFor(documents: BillingDocument[], expenses: Expense[], period: Period) {
  const invoices = documents.filter((doc) => doc.kind === 'invoice' && within(localDate(new Date(doc.issuedAt)), period))
  const costs = expenses.filter((expense) => within(expense.date, period))
  const income = invoices.reduce((sum, doc) => sum + doc.netCents, 0)
  const outputVat = invoices.reduce((sum, doc) => sum + doc.vatCents, 0)
  const expenditure = costs.reduce((sum, expense) => sum + expense.netCents, 0)
  const inputVat = costs.reduce((sum, expense) => sum + expense.vatCents, 0)
  return { invoices, costs, income, expenditure, profit: income - expenditure, outputVat, inputVat, vatBalance: outputVat - inputVat }
}

const euros = (cents: number) => (cents / 100).toFixed(2).replace('.', ',')
// Spreadsheet formula injection must not turn names/descriptions into formulas.
const safe = (value: string) => /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value

export function accountingExport(documents: BillingDocument[], expenses: Expense[], period: Period) {
  const { invoices, costs } = accountingFor(documents, expenses, period)
  return {
    fileName: `contabilidad-${period.start}-${period.end}-exclusivo.csv`,
    content: toCsv(['Tipo', 'Fecha', 'Número / referencia', 'Cliente / proveedor', 'Concepto', 'Base', 'IVA', 'Total'], [
      ...invoices.map((item) => ['Factura emitida', localDate(new Date(item.issuedAt)), safe(item.number), safe(item.customerName), safe(item.orderReference), euros(item.netCents), euros(item.vatCents), euros(item.totalCents)]),
      ...costs.map((item) => ['Gasto', item.date, safe(item.reference), safe(item.supplier), safe(item.description), euros(item.netCents), euros(item.vatCents), euros(item.netCents + item.vatCents)]),
    ]),
  }
}