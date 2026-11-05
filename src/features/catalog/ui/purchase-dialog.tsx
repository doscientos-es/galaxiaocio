import { CopyButton } from '@doscientos/ui'
import { Link } from '@tanstack/react-router'

import { FormDialog } from '@/shared/ui/form-dialog'

import { groupMissingBySupplier, purchaseMessage, safeSupplierUrl } from '../application/purchase'
import type { StockLineResult } from '../application/stock'
import type { Supplier } from '../application/supplier'

interface PurchaseDialogProps {
  open: boolean
  onClose: () => void
  lines: StockLineResult[]
  suppliers: Supplier[]
  reference?: string
}

export function PurchaseDialog({
  open,
  onClose,
  lines,
  suppliers,
  reference,
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
          </section>
        )
      })}
    </FormDialog>
  )
}
