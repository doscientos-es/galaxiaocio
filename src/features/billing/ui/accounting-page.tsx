import {
  Badge, Button, Card, ConfirmDialog, MetricCard, MetricGrid, PageHeader, PageHeaderActions,
  PageHeaderDescription, PageHeaderHeading, PageHeaderTitle, PageStack, Table, TableBody,
  TableCell, TableHead, TableHeader, TableNumber, TableRow, toast,
} from '@doscientos/ui'
import { Download, Euro, Plus, Receipt, TrendingUp } from 'lucide-react'
import { useState } from 'react'

import { useOrders } from '@/features/orders'
import { useShipping } from '@/features/shipping'
import { downloadTextFile } from '@/shared/lib/csv'
import { formatCents, formatDate } from '@/shared/lib/format'

import { accountingExport, accountingFor, periodFor, type PeriodKind } from '../application/accounting'
import { documentKindLabels, type BillingDocument } from '../application/document'
import type { Expense } from '../application/expense'
import { buildGestorExport } from '../application/gestor-export'
import { useBilling } from '../application/use-billing'
import { AccountingChart } from './accounting-chart'
import { DocumentDialog } from './document-dialog'
import { ExpenseDialog } from './expense-dialog'

export function AccountingPage() {
  const { documents, expenses, saveExpense, deleteExpense } = useBilling()
  const { orders } = useOrders()
  const { shipments } = useShipping()
  const [viewing, setViewing] = useState<BillingDocument>()
  const [editing, setEditing] = useState<Expense | 'new'>()
  const [removing, setRemoving] = useState<Expense>()
  const [kind, setKind] = useState<PeriodKind>('month')
  const [offset, setOffset] = useState(0)
  const now = new Date()
  const period = periodFor(now, kind, offset)
  const totals = accountingFor(documents, expenses, period)
  const periodDocuments = documents.filter((doc) => {
    const date = new Date(doc.issuedAt)
    return date >= new Date(`${period.start}T00:00:00`) && date < new Date(`${period.end}T00:00:00`)
  })

  function exportPeriod(exportKind: PeriodKind) {
    const file = accountingExport(documents, expenses, periodFor(now, exportKind, -1))
    downloadTextFile(file.fileName, file.content)
    toast.success('Exportación preparada')
  }
  function exportForAccountant() {
    for (const file of buildGestorExport(orders, documents, shipments, now)) downloadTextFile(file.fileName, file.content)
    toast.success('Exportación preparada', { description: 'Pedidos, albaranes y expediciones (CSV).' })
  }

  return <PageStack>
    <PageHeader>
      <PageHeaderHeading><PageHeaderTitle>Contabilidad</PageHeaderTitle><PageHeaderDescription>Ingresos, gastos e IVA en una sola vista.</PageHeaderDescription></PageHeaderHeading>
      <PageHeaderActions>
        <Button variant="outline" onPress={() => exportPeriod('month')}><Download aria-hidden /> Último mes</Button>
        <Button variant="outline" onPress={() => exportPeriod('quarter')}><Download aria-hidden /> Último trimestre</Button>
        <Button onPress={() => setEditing('new')}><Plus aria-hidden /> Nuevo gasto</Button>
      </PageHeaderActions>
    </PageHeader>
    <div className="flex flex-wrap items-center gap-2">
      <Button variant={kind === 'month' ? 'default' : 'outline'} onPress={() => { setKind('month'); setOffset(0) }}>Mensual</Button>
      <Button variant={kind === 'quarter' ? 'default' : 'outline'} onPress={() => { setKind('quarter'); setOffset(0) }}>Trimestral</Button>
      <Button variant="outline" onPress={() => setOffset((value) => value - 1)} aria-label="Periodo anterior">←</Button>
      <span className="min-w-36 text-center text-sm font-medium capitalize">{period.label}</span>
      <Button variant="outline" isDisabled={offset >= 0} onPress={() => setOffset((value) => value + 1)} aria-label="Periodo siguiente">→</Button>
    </div>
    <MetricGrid columns={4}>
      <MetricCard label="Ingresos (base)" value={formatCents(totals.income)} icon={<Euro />} description="Facturas emitidas" />
      <MetricCard label="Gastos (base)" value={formatCents(totals.expenditure)} icon={<Receipt />} description="Gastos registrados" />
      <MetricCard label="Resultado estimado" value={formatCents(totals.profit)} icon={<TrendingUp />} description="Ingresos menos gastos, sin IVA" />
      <MetricCard label="Saldo de IVA estimado" value={formatCents(totals.vatBalance)} icon={<Euro />} description={`Repercutido ${formatCents(totals.outputVat)} · soportado ${formatCents(totals.inputVat)}`} />
    </MetricGrid>
    <p className="text-muted-foreground text-sm">Estimación basada en facturas emitidas y gastos registrados; no incluye ventas sin factura propia ni gastos no registrados. No sustituye una liquidación fiscal.</p>
    <AccountingChart documents={documents} expenses={expenses} kind={kind} now={new Date(`${period.start}T12:00:00`)} />
    <section className="grid gap-3"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Gastos del periodo</h2><Button variant="outline" size="sm" onPress={() => setEditing('new')}><Plus aria-hidden /> Añadir gasto</Button></div>
      <Card className="py-0"><Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Concepto</TableHead><TableHead>Proveedor</TableHead><TableHead className="text-right">Base</TableHead><TableHead className="text-right">IVA</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader><TableBody>
        {totals.costs.map((expense) => <TableRow key={expense.id}><TableCell>{formatDate(`${expense.date}T12:00:00`)}</TableCell><TableCell><span className="font-medium">{expense.description}</span>{expense.source === 'stock' ? <Badge className="ml-2" variant="info">Stock</Badge> : null}</TableCell><TableCell>{expense.supplier || '—'}</TableCell><TableCell><TableNumber>{formatCents(expense.netCents)}</TableNumber></TableCell><TableCell><TableNumber>{formatCents(expense.vatCents)}</TableNumber></TableCell><TableCell><TableNumber>{formatCents(expense.netCents + expense.vatCents)}</TableNumber></TableCell><TableCell><div className="flex gap-2"><Button variant="outline" size="sm" aria-label={`Editar ${expense.description}`} onPress={() => setEditing(expense)}>Editar</Button><Button variant="outline" size="sm" aria-label={`Eliminar ${expense.description}`} onPress={() => setRemoving(expense)}>Eliminar</Button></div></TableCell></TableRow>)}
      </TableBody></Table>{totals.costs.length === 0 ? <p className="text-muted-foreground p-6 text-sm">No hay gastos en este periodo.</p> : null}</Card>
    </section>
    <section className="grid gap-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">Facturas y albaranes del periodo</h2><Button variant="outline" size="sm" onPress={exportForAccountant}><Download aria-hidden /> Exportar para el gestor</Button></div>
      <Card className="py-0"><Table><TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Cliente</TableHead><TableHead>Pedido</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Total</TableHead><TableHead /></TableRow></TableHeader><TableBody>
        {periodDocuments.map((document) => <TableRow key={document.id}><TableCell><span className="mr-2 font-medium">{document.number}</span><Badge variant={document.kind === 'invoice' ? 'info' : 'neutral'}>{documentKindLabels[document.kind]}</Badge></TableCell><TableCell>{document.customerName}</TableCell><TableCell>{document.orderReference}</TableCell><TableCell>{formatDate(document.issuedAt)}</TableCell><TableCell><TableNumber>{formatCents(document.totalCents)}</TableNumber></TableCell><TableCell><Button variant="outline" size="sm" onPress={() => setViewing(document)}>Ver</Button></TableCell></TableRow>)}
      </TableBody></Table>{periodDocuments.length === 0 ? <p className="text-muted-foreground p-6 text-sm">No hay documentos en este periodo.</p> : null}</Card>
    </section>
    <DocumentDialog document={viewing} onClose={() => setViewing(undefined)} />
    {editing ? <ExpenseDialog expense={editing === 'new' ? undefined : editing} onSave={saveExpense} onClose={() => setEditing(undefined)} /> : null}
    <ConfirmDialog open={!!removing} onOpenChange={(open) => !open && setRemoving(undefined)} title="Eliminar gasto" description="Esta acción elimina el gasto de los cálculos y exportaciones." confirmLabel="Eliminar" onConfirm={() => { if (removing) void deleteExpense(removing.id).then(() => { setRemoving(undefined); toast.success('Gasto eliminado') }).catch(() => toast.error('No se ha podido eliminar el gasto')) }} />
  </PageStack>
}