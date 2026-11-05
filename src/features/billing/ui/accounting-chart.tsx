import { Card, CardContent, CardHeader, CardTitle } from '@doscientos/ui'

import { formatCents } from '@/shared/lib/format'

import { accountingFor, periodFor, type PeriodKind } from '../application/accounting'
import type { BillingDocument } from '../application/document'
import type { Expense } from '../application/expense'

export function AccountingChart({ documents, expenses, kind, now }: {
  documents: BillingDocument[]; expenses: Expense[]; kind: PeriodKind; now: Date
}) {
  const points = Array.from({ length: kind === 'month' ? 6 : 4 }, (_, index) => {
    const period = periodFor(now, kind, index - (kind === 'month' ? 5 : 3))
    return { period, ...accountingFor(documents, expenses, period) }
  })
  const max = Math.max(1, ...points.flatMap((point) => [point.income, point.expenditure]))
  return <Card>
    <CardHeader><CardTitle>Evolución de ingresos y gastos</CardTitle></CardHeader>
    <CardContent className="grid gap-4">
      <p className="text-muted-foreground text-sm">Base imponible · <span className="text-primary">■ Ingresos</span> · <span className="text-orange-600">■ Gastos</span></p>
      <div className="grid gap-3">
        {points.map(({ period, income, expenditure }) => <div key={period.start} className="grid gap-1 sm:grid-cols-[10rem_1fr_11rem] sm:items-center">
          <span className="text-sm capitalize">{period.label}</span>
          <div className="grid gap-1" aria-hidden="true"><div className="bg-primary h-2 rounded" style={{ width: `${income / max * 100}%` }} /><div className="h-2 rounded bg-orange-500" style={{ width: `${expenditure / max * 100}%` }} /></div>
          <span className="text-muted-foreground text-xs">{formatCents(income)} / {formatCents(expenditure)}</span>
        </div>)}
      </div>
    </CardContent>
  </Card>
}