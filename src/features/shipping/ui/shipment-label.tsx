import {
  Button,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from '@doscientos/ui'
import { Printer } from 'lucide-react'

import type { Order } from '@/features/orders'
import { formatKg } from '@/shared/lib/format'

import type { Shipment } from '../application/carrier'

/** Decorative barcode derived from the tracking number (the real label comes from the carrier). */
function Barcode({ value }: { value: string }) {
  return (
    <div aria-hidden className="flex h-14 items-stretch gap-px">
      {value.split('').map((char, index) => (
        <span
          key={`${char}-${index}`}
          className="bg-foreground"
          style={{
            width: `${(char.charCodeAt(0) % 3) + 1}px`,
            marginRight: `${(index % 2) + 1}px`,
          }}
        />
      ))}
    </div>
  )
}

interface ShipmentLabelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
  shipment: Shipment
}

export function ShipmentLabelDialog({
  open,
  onOpenChange,
  order,
  shipment,
}: ShipmentLabelDialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[32rem]">
        <DialogHeader>
          <DialogTitle>Etiqueta de envío</DialogTitle>
          <DialogDescription>
            Vista previa interna. Si la agencia genera su propia etiqueta, imprime esa.
          </DialogDescription>
        </DialogHeader>
        <section
          aria-label="Etiqueta"
          className="print-label border-foreground grid gap-3 rounded-lg border-2 p-4"
        >
          <header className="flex items-baseline justify-between">
            <strong className="text-xl">{shipment.carrierName}</strong>
            <span className="text-sm">
              {shipment.packages} bulto(s) · {formatKg(shipment.weightKg)}
            </span>
          </header>
          <address className="text-sm leading-6 not-italic">
            <strong className="text-base">{order.customer.name}</strong>
            <br />
            {order.address.street}
            <br />
            {order.address.postalCode} {order.address.city}
            {order.customer.phone ? (
              <>
                <br />
                Tel. {order.customer.phone}
              </>
            ) : null}
          </address>
          <Barcode value={shipment.trackingNumber || order.reference} />
          <footer className="flex justify-between font-mono text-xs">
            <span>{shipment.trackingNumber || 'Sin seguimiento'}</span>
            <span>Ref. {order.reference}</span>
          </footer>
        </section>
        <DialogFooter>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onPress={() => window.print()}>
            <Printer aria-hidden />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}
