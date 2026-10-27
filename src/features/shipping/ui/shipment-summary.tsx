import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from '@doscientos/ui'
import { Printer } from 'lucide-react'
import { useState } from 'react'

import type { Order } from '@/features/orders'
import { formatCents, formatDateTime, formatKg } from '@/shared/lib/format'

import { serviceLabels, type Shipment } from '../application/carrier'
import { ShipmentLabelDialog } from './shipment-label'

const modeLabels = {
  recommended: 'Opción recomendada',
  alternative: 'Otra opción calculada',
  manual: 'Elegida manualmente',
} as const

export function ShipmentSummary({ order, shipment }: { order: Order; shipment: Shipment }) {
  const [labelOpen, setLabelOpen] = useState(false)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Envío registrado</CardTitle>
        <CardDescription>
          {shipment.carrierName} · {formatDateTime(shipment.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <DescriptionList className="sm:grid-cols-2">
          <DescriptionItem>
            <DescriptionTerm>Servicio</DescriptionTerm>
            <DescriptionDetails>
              {serviceLabels[shipment.service]} · {shipment.packages} bulto(s) ·{' '}
              {formatKg(shipment.weightKg)}
            </DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>Seguimiento</DescriptionTerm>
            <DescriptionDetails>{shipment.trackingNumber}</DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>Coste guardado</DescriptionTerm>
            <DescriptionDetails>{formatCents(shipment.costCents)}</DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>Criterio</DescriptionTerm>
            <DescriptionDetails>{modeLabels[shipment.mode]}</DescriptionDetails>
          </DescriptionItem>
        </DescriptionList>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onPress={() => setLabelOpen(true)}>
            <Printer aria-hidden />
            Imprimir etiqueta
          </Button>
          {shipment.savedCents > 0 ? (
            <Badge variant="success">
              Ahorro frente a la opción más cara: {formatCents(shipment.savedCents)}
            </Badge>
          ) : null}
        </div>
      </CardContent>
      <ShipmentLabelDialog
        open={labelOpen}
        onOpenChange={setLabelOpen}
        order={order}
        shipment={shipment}
      />
    </Card>
  )
}
