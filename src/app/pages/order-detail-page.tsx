import {
  Alert,
  AlertDescription,
  AlertTitle,
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
import { ArrowLeft, CircleCheck, Hourglass, PackageCheck, Zap } from 'lucide-react'
import { useState } from 'react'

import { BillingPanel, useBilling } from '@/features/billing'
import {
  evaluateStock,
  InsufficientStockError,
  orderTotals,
  StockPanel,
  useCatalog,
} from '@/features/catalog'
import {
  ChannelLabel,
  OrderDataPanel,
  OrderProgress,
  OrderStageBadge,
  useOrders,
} from '@/features/orders'
import { ShippingPanel } from '@/features/shipping'
import { formatCents } from '@/shared/lib/format'

import { nextStep } from './next-step'

const stepIcons = { action: Zap, waiting: Hourglass, done: CircleCheck } as const
const stepVariants = { action: 'info', waiting: 'warning', done: 'success' } as const

/**
 * One order, one screen: the agreed flow from validation to administration.
 * This page is the only place that coordinates several features at once.
 */
export function OrderDetailPage({ orderId }: { orderId: string }) {
  const navigate = useNavigate()
  const { orders, advance, setSupplierStatus, logActivity, getLatest } = useOrders()
  const { products, reserve } = useCatalog()
  const { issueDocuments } = useBilling()
  const [preparing, setPreparing] = useState(false)
  const order = orders.find((candidate) => candidate.id === orderId)

  if (!order) {
    return (
      <DataViewState>
        <DataViewStateTitle>Pedido no encontrado</DataViewStateTitle>
        <DataViewStateDescription>Puede que se haya restablecido la demo.</DataViewStateDescription>
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
      // Re-read the order: if it already moved on (double click), do not reserve stock twice.
      if ((await getLatest(order)).stage !== 'stored') return
      await reserve(order.lines, order.supplierStatus)
      await advance(order, 'ready')
      await log('Listo para expedición', 'Stock reservado', 'success')
      toast.success('Pedido preparado para expedición', {
        description: 'El stock se ha reservado.',
      })
    } catch (error) {
      if (!(error instanceof InsufficientStockError)) throw error
      toast.error('Otro pedido se ha llevado el stock', { description: error.message })
    } finally {
      setPreparing(false)
    }
  }

  const stock = evaluateStock(order.lines, products, {
    supplierReceived: order.supplierStatus === 'received',
  })
  const step = nextStep({
    stage: order.stage,
    stock: stock.status,
    supplierStatus: order.supplierStatus,
    marketplace: order.marketplace,
  })
  const StepIcon = stepIcons[step.tone]
  const totals = orderTotals(order.lines, products)
  const beyondStock =
    order.stage === 'ready' || order.stage === 'shipped' || order.stage === 'closed'

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>{order.reference}</PageHeaderTitle>
          <PageHeaderDescription className="flex flex-wrap items-center gap-3">
            <span>{order.customer.name || 'Cliente sin identificar'}</span>
            <ChannelLabel channel={order.channel} marketplace={order.marketplace} />
            <OrderStageBadge stage={order.stage} />
            {order.customerId ? <Badge variant="neutral">Cliente guardado</Badge> : null}
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
      <OrderProgress stage={order.stage} />
      <Alert variant={stepVariants[step.tone]}>
        <StepIcon aria-hidden />
        <AlertTitle>{step.title}</AlertTitle>
        <AlertDescription>{step.detail}</AlertDescription>
      </Alert>
      <OrderDataPanel key={order.id} order={order} />
      {order.stage === 'stored' ? (
        <StockPanel
          reference={order.reference}
          lines={order.lines}
          supplierStatus={order.supplierStatus}
          onNotifySupplier={(lines) => {
            void setSupplierStatus(order, 'notified')
            void log(
              'Avisado al equipo para pedir al proveedor',
              lines.map((line) => line.name).join(', '),
            )
            toast.info('Equipo avisado', { description: 'Pedir al proveedor externo.' })
          }}
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
      {beyondStock ? (
        <ShippingPanel
          order={order}
          onShipped={async (shipment) => {
            await advance(order, 'shipped')
            await log('Pedido enviado', shipment.carrierName, 'success')
            // The delivery note and invoice are produced from the order data, no extra click.
            const documents = await issueDocuments(order)
            await log(
              'Documentos generados',
              documents.map((document) => document.number).join(' · '),
              'success',
            )
            toast.success('Albarán y factura generados', {
              description: documents.map((document) => document.number).join(' · '),
            })
          }}
        />
      ) : null}
      {order.stage === 'shipped' || order.stage === 'closed' ? (
        <BillingPanel
          order={order}
          onPrepared={async () => {
            await advance(order, 'closed')
            await log('Preparado para el gestor', 'Albarán y factura', 'success')
          }}
        />
      ) : null}
    </PageStack>
  )
}
