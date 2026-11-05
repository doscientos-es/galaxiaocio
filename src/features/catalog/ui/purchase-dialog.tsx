import { Button, CopyButton, Field, FieldLabel, Input, toast } from '@doscientos/ui'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { parseEuros } from '@/shared/lib/money'
import { FormDialog } from '@/shared/ui/form-dialog'

import { groupMissingBySupplier, purchaseMessage, safeSupplierUrl, type PurchaseGroup, type StockPurchase } from '../application/purchase'
import type { StockLineResult } from '../application/stock'
import type { Supplier } from '../application/supplier'

interface PurchaseDialogProps {
  open: boolean
  onClose: () => void
  lines: StockLineResult[]
  suppliers: Supplier[]
  reference?: string
  onPurchase: (purchase: StockPurchase) => Promise<void>
}

export function PurchaseDialog({
  open,
  onClose,
  lines,
  suppliers,
  reference,
  onPurchase,
}: PurchaseDialogProps) {
  const groups = groupMissingBySupplier(lines, suppliers)
  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={reference ? 'Pedir stock faltante' : 'Pedir más'}
      description="Consulta los datos del proveedor y prepara tu solicitud. Esta acción no modifica el stock."
      showSubmit={false}
      size="lg"
      onSubmit={() => undefined}
    >
      {groups.some((group) => group.supplier?.email.endsWith('@example.com')) ? (
        <p className="text-muted-foreground text-sm">
          Los emails con @example.com son de prueba. Sustitúyelos antes de enviar pedidos reales.
        </p>
      ) : null}
      {groups.map((group) => {
        const url = safeSupplierUrl(group.supplier?.url)
        const subject = `Solicitud de artículos${reference ? ` · ${reference}` : ''}`
        const message = reference ? purchaseMessage(reference, group) : ''
        const mailto = group.supplier?.email
          ? `mailto:${encodeURIComponent(group.supplier.email)}?subject=${encodeURIComponent(subject)}${message ? `&body=${encodeURIComponent(message)}` : ''}`
          : undefined
        return (
          <section
            key={group.supplier?.id ?? group.name ?? 'unassigned'}
            className="grid gap-3 rounded-lg border p-4"
          >
            <h3 className="font-semibold">{group.name ?? 'Proveedor sin asignar'}</h3>
            <ul className="text-sm">
              {group.lines.map((line) => (
                <li key={line.sku}>
                  {reference ? `${line.missing} × ` : ''}
                  {line.name} · {line.sku || 'sin referencia'}
                </li>
              ))}
            </ul>
            <p className="text-sm">Email: {group.supplier?.email || 'No registrado'}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              {mailto ? (
                <a className="text-primary underline" href={mailto}>
                  Abrir correo al proveedor
                </a>
              ) : null}
              {url ? (
                <a className="text-primary underline" href={url} target="_blank" rel="noreferrer">
                  Ir al proveedor
                </a>
              ) : null}
              {!group.supplier?.email || !group.name ? (
                <Link to="/catalogo" className="underline">
                  Completar datos en catálogo
                </Link>
              ) : null}
            </div>
            {reference ? (
              <>
                <div className="bg-muted grid gap-2 rounded-md p-3 text-sm">
                  <p>
                    <strong>Asunto:</strong> {subject}
                  </p>
                  <p className="whitespace-pre-wrap">{message}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyButton variant="outline" value={subject}>
                    Copiar asunto
                  </CopyButton>
                  <CopyButton variant="outline" value={message}>
                    Copiar mensaje
                  </CopyButton>
                  {group.supplier?.email ? (
                    <CopyButton variant="outline" value={group.supplier.email}>
                      Copiar email
                    </CopyButton>
                  ) : null}
                </div>
              </>
            ) : null}
            <PurchaseRegistration group={group} reference={reference} onPurchase={onPurchase} />
          </section>
        )
      })}
    </FormDialog>
  )
}

function PurchaseRegistration({ group, reference, onPurchase }: {
  group: PurchaseGroup
  reference: string | undefined
  onPurchase: (purchase: StockPurchase) => Promise<void>
}) {
  const [base, setBase] = useState('')
  const [vat, setVat] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const netCents = parseEuros(base)
  const vatCents = parseEuros(vat)
  const quantityNumber = Number(quantity)

  async function register() {
    if (saving || saved || netCents === undefined || vatCents === undefined ||
      (!reference && (!Number.isSafeInteger(quantityNumber) || quantityNumber < 1))) return
    setSaving(true)
    try {
      await onPurchase({
        supplier: group.name ?? '', reference: reference ?? '', netCents, vatCents,
        description: group.lines.map((line) => `${reference ? line.missing : quantityNumber} × ${line.name} (${line.sku})`).join(', '),
      })
      setSaved(true)
      toast.success('Compra registrada en contabilidad')
    } catch {
      toast.error('No se ha podido registrar la compra')
    } finally {
      setSaving(false)
    }
  }

  return <div className="grid gap-3 border-t pt-3">
    <p className="text-sm font-medium">Registrar compra y gasto</p>
    <p className="text-muted-foreground text-xs">Cuando hayas realizado la compra, indica su importe. No se envía ningún pedido ni se modifica el stock.</p>
    <div className="grid gap-3 sm:grid-cols-3">
      {!reference ? <Field><FieldLabel>Unidades</FieldLabel><Input aria-label="Unidades de compra" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field> : null}
      <Field><FieldLabel>Base de compra (€)</FieldLabel><Input aria-label={`Base de compra ${group.name ?? 'sin proveedor'}`} inputMode="decimal" value={base} onChange={(event) => setBase(event.target.value)} /></Field>
      <Field><FieldLabel>IVA de compra (€)</FieldLabel><Input aria-label={`IVA de compra ${group.name ?? 'sin proveedor'}`} inputMode="decimal" value={vat} onChange={(event) => setVat(event.target.value)} /></Field>
    </div>
    <Button variant="outline" isDisabled={saved || saving || netCents === undefined || vatCents === undefined || (!reference && (!Number.isSafeInteger(quantityNumber) || quantityNumber < 1))} onPress={() => void register()}>{saved ? 'Compra registrada' : 'Registrar compra y gasto'}</Button>
  </div>
}
