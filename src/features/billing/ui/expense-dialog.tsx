import { Field, FieldLabel, Input, toast } from '@doscientos/ui'
import { useState } from 'react'

import { createId } from '@/shared/lib/ids'
import { parseEuros } from '@/shared/lib/money'
import { FormDialog } from '@/shared/ui/form-dialog'

import { localDate, type Expense } from '../application/expense'

export function ExpenseDialog({ expense, onClose, onSave }: {
  expense: Expense | undefined
  onClose: () => void
  onSave: (expense: Expense) => Promise<unknown>
}) {
  const [date, setDate] = useState(expense?.date ?? localDate(new Date()))
  const [description, setDescription] = useState(expense?.description ?? '')
  const [supplier, setSupplier] = useState(expense?.supplier ?? '')
  const [reference, setReference] = useState(expense?.reference ?? '')
  const [base, setBase] = useState(expense ? (expense.netCents / 100).toFixed(2) : '')
  const [vat, setVat] = useState(expense ? (expense.vatCents / 100).toFixed(2) : '')
  const [saving, setSaving] = useState(false)
  const netCents = parseEuros(base)
  const vatCents = parseEuros(vat)

  async function submit() {
    if (!description.trim() || !date || netCents === undefined || vatCents === undefined) return
    setSaving(true)
    try {
      await onSave({ id: expense?.id ?? createId('expense'), date, description: description.trim(), supplier: supplier.trim(), reference: reference.trim(), netCents, vatCents, source: expense?.source ?? 'manual' })
      toast.success('Gasto guardado')
      onClose()
    } catch {
      toast.error('No se ha podido guardar el gasto')
    } finally { setSaving(false) }
  }

  return <FormDialog open onOpenChange={(open) => !open && onClose()} title={expense ? 'Editar gasto' : 'Nuevo gasto'} description="Introduce los importes de la factura o justificante." loading={saving} onSubmit={() => void submit()} submitDisabled={!date || !description.trim() || netCents === undefined || vatCents === undefined}>
    <Field><FieldLabel htmlFor="expense-description">Concepto</FieldLabel><Input id="expense-description" value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field><FieldLabel htmlFor="expense-date">Fecha</FieldLabel><Input id="expense-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
      <Field><FieldLabel htmlFor="expense-supplier">Proveedor</FieldLabel><Input id="expense-supplier" value={supplier} onChange={(event) => setSupplier(event.target.value)} /></Field>
      <Field><FieldLabel htmlFor="expense-base">Base (€)</FieldLabel><Input id="expense-base" inputMode="decimal" value={base} onChange={(event) => setBase(event.target.value)} /></Field>
      <Field><FieldLabel htmlFor="expense-vat">IVA (€)</FieldLabel><Input id="expense-vat" inputMode="decimal" value={vat} onChange={(event) => setVat(event.target.value)} /></Field>
    </div>
    <Field><FieldLabel htmlFor="expense-reference">Referencia o número de factura</FieldLabel><Input id="expense-reference" value={reference} onChange={(event) => setReference(event.target.value)} /></Field>
  </FormDialog>
}