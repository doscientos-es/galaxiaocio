import { Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@doscientos/ui'

import { BillingPanel } from '@/features/billing'
import { OrderCustomerLink, OrderHistory, OrderJournal, type Order } from '@/features/orders'
import { DeliveryTracking, ShipmentSummary, useShipping } from '@/features/shipping'
import { formatDateTime } from '@/shared/lib/format'

function OrderInformation({ order, customerIds }: { order: Order; customerIds: ReadonlySet<string> }) {
  const { customer, address, source } = order
  const phone = customer.phone.replace(/[^+0-9]/g, '')
  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Cliente</CardTitle><CardDescription>Datos de contacto del pedido</CardDescription></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <strong><OrderCustomerLink order={order} customerIds={customerIds} /></strong>
            <span>NIF: {customer.taxId || 'No indicado'}</span>
            {phone ? <a className="text-primary break-all underline" href={`tel:${phone}`}>{customer.phone}</a> : <span>Sin teléfono</span>}
            {customer.email ? <a className="text-primary break-all underline" href={`mailto:${encodeURIComponent(customer.email)}`}>{customer.email}</a> : <span>Sin email</span>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Dirección de entrega</CardTitle><CardDescription>Destino registrado</CardDescription></CardHeader>
          <CardContent className="grid gap-1 text-sm">
            <span>{address.street || 'Sin dirección'}</span>
            {address.street2 ? <span>{address.street2}</span> : null}
            <span>{[address.postalCode, address.city].filter(Boolean).join(' ')}</span>
            <span>{[address.province, address.country].filter(Boolean).join(', ')}</span>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Artículos</CardTitle><CardDescription>Recibido el {formatDateTime(order.receivedAt)}</CardDescription></CardHeader>
        <CardContent><ul className="divide-border divide-y">{order.lines.map((line) => <li key={line.id} className="flex items-start justify-between gap-4 py-3"><span className="min-w-0"><strong className="block break-words">{line.description || line.sku}</strong><span className="text-muted-foreground text-xs">{line.sku || 'Sin referencia'}</span></span><span className="shrink-0 tabular-nums">{line.quantity} uds.</span></li>)}</ul></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Notas y origen</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <p className="whitespace-pre-wrap break-words">{order.notes || 'Sin notas para este pedido.'}</p>
          {source ? <details><summary className="cursor-pointer font-medium">Datos originales del pedido</summary><dl className="text-muted-foreground grid gap-2 pt-3">{([['Referencia', source.reference], ['Fecha', source.date], ['Vendedor', source.seller], ['Comprador', source.buyer], ['Servicio', source.shippingService], ['Total original', source.total]] as const).filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="font-medium">{label}</dt><dd className="break-words">{value}</dd></div>)}</dl>{source.originalText ? <p className="mt-3 whitespace-pre-wrap break-words">{source.originalText}</p> : null}</details> : null}
          {order.whatsappPhoto ? <details><summary className="cursor-pointer font-medium">Texto de la foto recibida</summary><p className="mt-3 whitespace-pre-wrap break-words">{order.whatsappPhoto.transcript.join('\n')}</p></details> : null}
        </CardContent>
      </Card>
    </div>
  )
}

export function SentOrderDetail({ order, customerIds, onDelivered, onPrepared }: { order: Order; customerIds: ReadonlySet<string>; onDelivered: () => Promise<void>; onPrepared: () => Promise<void> }) {
  const { shipmentFor } = useShipping()
  const shipment = shipmentFor(order.id)
  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground text-sm">{order.deliveredAt ? 'Pedido recibido' : 'Pedido enviado'} · Consulta y gestiona toda la información desde esta ficha.</p>
      <Tabs defaultSelectedKey="summary">
        <div className="max-w-full overflow-x-auto"><TabsList aria-label="Información del pedido"><TabsTrigger id="summary">Resumen</TabsTrigger><TabsTrigger id="documents">Documentos</TabsTrigger><TabsTrigger id="incidents">Incidencias</TabsTrigger><TabsTrigger id="communications">Comunicaciones</TabsTrigger><TabsTrigger id="history">Histórico</TabsTrigger></TabsList></div>
        <TabsContent id="summary" className="pt-3">
          <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <OrderInformation order={order} customerIds={customerIds} />
            <div className="grid min-w-0 gap-4"><DeliveryTracking order={order} onDelivered={onDelivered} />{shipment ? <details><summary className="text-muted-foreground cursor-pointer text-sm font-medium">Ver datos del envío</summary><div className="pt-3"><ShipmentSummary order={order} shipment={shipment} /></div></details> : null}</div>
          </div>
        </TabsContent>
        <TabsContent id="documents" className="pt-3"><BillingPanel order={order} onPrepared={onPrepared} /></TabsContent>
        <TabsContent id="incidents" className="pt-3"><OrderJournal order={order} kind="incident" /></TabsContent>
        <TabsContent id="communications" className="pt-3"><OrderJournal order={order} kind="communication" /></TabsContent>
        <TabsContent id="history" className="pt-3"><OrderHistory order={order} /></TabsContent>
      </Tabs>
    </div>
  )
}