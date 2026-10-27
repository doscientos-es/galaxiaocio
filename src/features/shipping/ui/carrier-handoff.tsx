import { Button, Field, FieldLabel, Input, toast, useClipboard } from '@doscientos/ui'
import { ExternalLink, PackageCheck } from 'lucide-react'
import { useState } from 'react'

import type { Order } from '@/features/orders'
import { formatKg } from '@/shared/lib/format'

import type { Carrier } from '../application/carrier'

interface CarrierHandoffProps {
  order: Order
  carrier: Carrier
  weightKg: number
  packages: number
  trackingNumber: string
  costInput: string
  saving: boolean
  onTrackingChange: (value: string) => void
  onCostChange: (value: string) => void
  onConfirm: () => void
}

/**
 * Accepting the carrier copies the shipment data and opens the carrier's website, so the
 * person only has to paste it. Afterwards they bring back the tracking number and the cost.
 */
export function CarrierHandoff(props: CarrierHandoffProps) {
  const { order, carrier, weightKg, packages } = props
  const { copy } = useClipboard()
  const [accepted, setAccepted] = useState(false)

  const fields: Array<[label: string, value: string]> = [
    ['Destinatario', order.customer.name],
    ['Dirección', order.address.street],
    ['Código postal', order.address.postalCode],
    ['Población', order.address.city],
    ['Teléfono', order.customer.phone],
    ['Peso', formatKg(weightKg)],
    ['Bultos', String(packages)],
    ['Referencia', order.reference],
  ]
  const clipboardText = fields.map(([label, value]) => `${label}: ${value}`).join('\n')
  const costValid = Number(props.costInput.replace(',', '.')) > 0

  async function acceptAndOpen() {
    // Open the tab first, in the same click, so the browser does not block it.
    window.open(carrier.portalUrl, '_blank', 'noopener,noreferrer')
    setAccepted(true)
    const copied = await copy(clipboardText)
    if (copied) {
      toast.success('Datos copiados', { description: `Pégalos en la web de ${carrier.name}.` })
    } else {
      toast.warning('No se han podido copiar los datos', {
        description: 'Cópialos a mano desde la lista de abajo.',
      })
    }
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-3">
        <h4 className="text-sm font-semibold">Datos del envío</h4>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className="truncate text-sm font-medium">{value || '—'}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <Button onPress={() => void acceptAndOpen()}>
            <ExternalLink aria-hidden />
            {accepted ? `Abrir ${carrier.name} otra vez` : `Aceptar y abrir ${carrier.name}`}
          </Button>
          <span className="text-muted-foreground text-xs">
            Se copian los datos y se abre su web: solo tienes que pegarlos.
          </span>
        </div>
      </section>
      {accepted ? (
        <section className="grid gap-3">
          <h4 className="text-sm font-semibold">Cuando lo tengas reservado</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="tracking-number">Nº de seguimiento</FieldLabel>
              <Input
                id="tracking-number"
                value={props.trackingNumber}
                placeholder="Ej. 0048213377"
                onChange={(event) => props.onTrackingChange(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="shipping-cost">Coste real (€, sin IVA)</FieldLabel>
              <Input
                id="shipping-cost"
                inputMode="decimal"
                value={props.costInput}
                onChange={(event) => props.onCostChange(event.target.value)}
              />
            </Field>
          </div>
          <Button
            className="w-fit"
            isDisabled={props.saving || props.trackingNumber.trim() === '' || !costValid}
            onPress={props.onConfirm}
          >
            <PackageCheck aria-hidden />
            Marcar como enviado
          </Button>
        </section>
      ) : null}
    </div>
  )
}
