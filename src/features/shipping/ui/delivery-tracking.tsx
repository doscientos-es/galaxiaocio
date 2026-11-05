import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CopyButton,
} from '@doscientos/ui'
import { ExternalLink, PackageCheck } from 'lucide-react'
import { useState } from 'react'

import type { Order } from '@/features/orders'
import { formatDateTime } from '@/shared/lib/format'

import { useShipping } from '../application/use-shipping'

function safeWebUrl(value: string | undefined): string | undefined {
  try {
    const url = new URL(value ?? '')
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined
  } catch {
    return undefined
  }
}

export function DeliveryTracking({
  order,
  onDelivered,
}: {
  order: Order
  onDelivered: () => Promise<void>
}) {
  const { shipmentFor, carrierForShipment } = useShipping()
  const [saving, setSaving] = useState(false)
  const shipment = shipmentFor(order.id)
  const carrier = shipment ? carrierForShipment(shipment.carrierId) : undefined
  const url = safeWebUrl(carrier?.portalUrl) ?? safeWebUrl(shipment?.carrierPortalUrl)

  async function confirmDelivery() {
    setSaving(true)
    try {
      await onDelivered()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consulta pedido</CardTitle>
        <CardDescription>
          Consulta el seguimiento en la web de la agencia y confirma la entrega manualmente.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {shipment ? (
          <>
            <p className="text-sm">
              <strong>Agencia:</strong> {shipment.carrierName}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>
                <strong>Nº de seguimiento:</strong> {shipment.trackingNumber || 'No registrado'}
              </span>
              {shipment.trackingNumber ? (
                <CopyButton variant="outline" value={shipment.trackingNumber}>
                  Copiar seguimiento
                </CopyButton>
              ) : null}
            </div>
            {url ? (
              <a
                className="text-primary flex w-fit items-center gap-2 text-sm underline"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink aria-hidden className="size-4" />
                Consultar pedido en {shipment.carrierName}
              </a>
            ) : (
              <p className="text-muted-foreground text-sm">
                La web de esta agencia no está disponible.
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            No hay datos de envío registrados para este pedido.
          </p>
        )}
        {order.deliveredAt ? (
          <Badge variant="success" className="w-fit">
            Recibido · {formatDateTime(order.deliveredAt)}
          </Badge>
        ) : (
          <Button
            className="w-fit"
            variant="outline"
            isDisabled={saving}
            onPress={() => void confirmDelivery()}
          >
            <PackageCheck aria-hidden />
            Marcar como recibido
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
