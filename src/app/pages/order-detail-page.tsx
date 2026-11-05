import {
  Badge,
  Button,
  DataViewState,
  DataViewStateActions,
  DataViewStateDescription,
  DataViewStateTitle,
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
  PageStack,
  toast,
} from '@doscientos/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, PackageCheck } from 'lucide-react'
import { useState } from 'react'

import { useBilling } from '@/features/billing'
import {
  InsufficientStockError,
  orderTotals,
  StockPanel,
  useCatalog,
} from '@/features/catalog'
import {
  ChannelLabel,
  OrderCustomerLink,
  OrderDataPanel,
  OrderProgress,
  OrderStageBadge,
  useOrders,
  withOrderOperation,
  type Order,
} from '@/features/orders'
import { ShippingPanel, type Shipment } from '@/features/shipping'
import { useStockPurchase } from '@/app/use-stock-purchase'
import { formatCents } from '@/shared/lib/format'

import { SentOrderDetail } from './sent-order-detail'

function PreviousOrderData({ order }: { order: Order }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="grid gap-3">
      <Button
        className="w-fit"
        variant="outline"
        aria-expanded={open}
        onPress={() => setOpen(!open)}
      >
        {open ? 'Ocultar datos del pedido' : 'Ver datos del pedido'}
      </Button>
      {open ? <OrderDataPanel order={order} onValidated={() => setOpen(false)} /> : null}
    </section>
  )
}

/**
 * One order, one screen: the agreed flow from validation to administration.
 * This page is the only place that coordinates several features at once.
 */
export function OrderDetailPage({ orderId }: { orderId: string }) {
  const navigate = useNavigate()
  const { orders, customers, advance, markDelivered, setSupplierStatus, logActivity, getLatest } = useOrders()
  const { products, reserve } = useCatalog()
  const { issueDocuments } = useBilling()
  const onPurchase = useStockPurchase()
  const [preparing, setPreparing] = useState(false)
  const order = orders.find((candidate) => candidate.id === orderId)

  if (!order) {
    return (
      <DataViewState>
        <DataViewStateTitle>Pedido no encontrado</DataViewStateTitle>
        <DataViewStateDescription>
          Puede que se hayan restablecido los datos.
        </DataViewStateDescription>
        <DataViewStateActions>
          <Link to="/pedidos" className="text-sm underline">
            Volver a pedidos
          </Link>
        </DataViewStateActions>
      </DataViewState>
    )
  }

  const log = (title: string, detail: string, tone: 'info' | 'success' | 'warning' = 'info') =>
    logActivity({ title, detail: `${order.reference} · ${detail}`, tone, orderId: order.id })

  async function prepareShipment() {
    if (!order || preparing) return
    setPreparing(true)
    try {
      await withOrderOperation(order.id, async () => {
        // Re-read inside the lock so a deleted or already prepared order cannot reserve stock.
        const current = await getLatest(order)
        if (current.stage !== 'stored') return
        await reserve(current.lines, current.supplierStatus)
        await advance(current, 'ready')
        await log('Listo para expedición', 'Stock reservado', 'success')
        toast.success('Pedido preparado para expedición', {
          description: 'El stock se ha reservado.',
        })
      })
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        toast.error('Otro pedido se ha llevado el stock', { description: error.message })
      } else {
        toast.error('No se ha podido preparar el pedido', {
          description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
        })
      }
    } finally {
      setPreparing(false)
    }
  }

  async function handleShipped(shipment: Shipment) {
    if (!order) return
    await advance(order, 'shipped')
    await log('Pedido enviado', shipment.carrierName, 'success')
    const documents = await issueDocuments(order)
    await log(
      'Documentos generados',
      documents.map((document) => document.number).join(' · '),
      'success',
    )
    toast.success('Albarán y factura generados', {
      description: documents.map((document) => document.number).join(' · '),
    })
  }

  const totals = orderTotals(order.lines, products)
  const customerIds = new Set(customers.map((customer) => customer.id))

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>{order.reference}</PageHeaderTitle>
          <PageHeaderDescription className="flex flex-wrap items-center gap-3">
            <OrderCustomerLink order={order} customerIds={customerIds} />
            <ChannelLabel channel={order.channel} marketplace={order.marketplace} />
            <OrderStageBadge stage={order.stage} deliveredAt={order.deliveredAt} />
            {order.customerId && customerIds.has(order.customerId) ? <Badge variant="neutral">Cliente guardado</Badge> : null}
            {totals.totalCents > 0 ? (
              <span className="text-foreground font-medium tabular-nums">
                {formatCents(totals.totalCents)}{' '}
                <span className="text-muted-foreground font-normal">IVA incl.</span>
              </span>
            ) : null}
          </PageHeaderDescription>
        </PageHeaderHeading>
        <PageHeaderActions>
          <Button variant="outline" size="sm" onPress={() => void navigate({ to: '/pedidos' })}>
            <ArrowLeft aria-hidden />
            Pedidos
          </Button>
        </PageHeaderActions>
      </PageHeader>
      {order.stage === 'shipped' || order.stage === 'closed' ? (
        <SentOrderDetail
          order={order}
          customerIds={customerIds}
          onDelivered={async () => {
            if (await markDelivered(order.id)) {
              await log('Pedido recibido', 'Entrega confirmada manualmente', 'success')
              toast.success('Pedido marcado como recibido')
            }
          }}
          onPrepared={async () => {
            await advance(order, 'closed')
            await log('Preparado para el gestor', 'Albarán y factura', 'success')
          }}
        />
      ) : <>
        <p className="text-muted-foreground text-sm">
          {order.customer.phone || 'Sin teléfono'} · {order.customer.email || 'Sin email'}
        </p>
        <OrderProgress stage={order.stage} />
        {order.stage === 'review' || order.stage === 'incomplete' ? (
          <OrderDataPanel key={order.id} order={order} />
        ) : null}
        {order.stage === 'stored' ? (
          <StockPanel
            onPurchase={onPurchase}
            reference={order.reference}
            lines={order.lines}
            supplierStatus={order.supplierStatus}
            onSupplierReceived={() => {
              void setSupplierStatus(order, 'received')
              void log('Material recibido del proveedor', 'Listo para preparar', 'success')
            }}
            action={
              <Button isDisabled={preparing} onPress={() => void prepareShipment()}>
                <PackageCheck aria-hidden />
                Preparar expedición
              </Button>
            }
          />
        ) : null}
        {order.stage === 'ready' ? <ShippingPanel order={order} onShipped={handleShipped} /> : null}
        {order.stage !== 'review' && order.stage !== 'incomplete' ? (
          <PreviousOrderData key={`${order.id}-${order.stage}`} order={order} />
        ) : null}
      </>}
    </PageStack>
  )
}
