import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MetricCard,
  MetricGrid,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
  PageStack,
} from '@doscientos/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, PackageCheck, PiggyBank, Truck } from 'lucide-react'

import { evaluateStock, useCatalog } from '@/features/catalog'
import { OrderCustomerLink, useOrders, type OrderStage } from '@/features/orders'
import { useShipping } from '@/features/shipping'
import { formatCents, formatDateTime } from '@/shared/lib/format'

import { nextStep } from './next-step'

type Navigate = ReturnType<typeof useNavigate>

const openOrder = (navigate: Navigate, orderId: string) =>
  void navigate({ to: '/pedidos/$orderId', params: { orderId } })

/** Lower is more urgent. Finished orders never appear in the pending list. */
const priority: Record<OrderStage, number> = {
  review: 0,
  incomplete: 1,
  shipped: 2,
  ready: 3,
  stored: 4,
  closed: 99,
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { orders, customers, activity } = useOrders()
  const customerIds = new Set(customers.map((customer) => customer.id))
  const { products } = useCatalog()
  const { shipments } = useShipping()

  const pending = orders
    .filter((order) => order.stage !== 'closed')
    .map((order) => ({
      order,
      step: nextStep({
        stage: order.stage,
        stock: evaluateStock(order.lines, products, {
          supplierReceived: order.supplierStatus === 'received',
        }).status,
        supplierStatus: order.supplierStatus,
        marketplace: order.marketplace,
        deliveredAt: order.deliveredAt,
      }),
    }))
    .sort(
      (a, b) =>
        Number(a.step.tone === 'waiting') - Number(b.step.tone === 'waiting') ||
        priority[a.order.stage] - priority[b.order.stage],
    )
    .slice(0, 6)
  const attention = orders.filter((o) => o.stage === 'review' || o.stage === 'incomplete').length
  const waiting = orders.filter(
    (o) =>
      o.stage === 'stored' &&
      evaluateStock(o.lines, products, { supplierReceived: o.supplierStatus === 'received' })
        .status !== 'ok',
  ).length
  const ready = orders.filter((o) => o.stage === 'ready').length
  const saved = shipments.reduce((sum, shipment) => sum + shipment.savedCents, 0)
  const recent = [...activity].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 7)

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Resumen</PageHeaderTitle>
          <PageHeaderDescription>
            Del pedido recibido a la expedición y al gestor, sin copiar datos a mano.
          </PageHeaderDescription>
        </PageHeaderHeading>
      </PageHeader>
      <MetricGrid columns={4}>
        <MetricCard
          label="Requieren atención"
          value={attention}
          tone="warning"
          icon={<AlertTriangle />}
          description="Fotos por revisar o datos incompletos"
        />
        <MetricCard
          label="Pendientes de stock"
          value={waiting}
          tone="info"
          icon={<PackageCheck />}
          description="Faltan artículos o hay que pedir a proveedor"
        />
        <MetricCard
          label="Listos para enviar"
          value={ready}
          icon={<Truck />}
          description="Stock reservado, falta elegir transporte"
        />
        <MetricCard
          label="Ahorro en transporte"
          value={formatCents(saved)}
          tone="success"
          icon={<PiggyBank />}
          description={`${shipments.length} envío(s) · frente a la opción más cara`}
        />
      </MetricGrid>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pendiente de ti</CardTitle>
            <CardDescription>Qué toca hacer con cada pedido, lo urgente primero.</CardDescription>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay pedidos pendientes. 🎉</p>
            ) : (
              <ul className="grid gap-3">
                {pending.map(({ order, step }) => (
                  <li key={order.id} className="flex items-start gap-3">
                    <span className="grid flex-1 gap-0.5">
                      <span className="text-sm font-medium">
                        {order.reference} · <OrderCustomerLink order={order} customerIds={customerIds} />
                      </span>
                      <span className="text-muted-foreground text-xs">{step.title}</span>
                    </span>
                    {step.tone === 'waiting' ? <Badge variant="warning">En espera</Badge> : null}
                    <Button
                      variant={step.tone === 'action' ? 'default' : 'outline'}
                      size="sm"
                      onPress={() => openOrder(navigate, order.id)}
                    >
                      Abrir
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Lo último que ha pasado con los pedidos.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3">
              {recent.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-3">
                  <span className="grid gap-0.5">
                    {entry.orderId && orders.some((order) => order.id === entry.orderId) ? (
                      <Link
                        to="/pedidos/$orderId"
                        params={{ orderId: entry.orderId }}
                        className="text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {entry.title}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium">{entry.title}</span>
                    )}
                    <span className="text-muted-foreground text-xs">{entry.detail}</span>
                  </span>
                  <Badge
                    variant={
                      entry.tone === 'success'
                        ? 'success'
                        : entry.tone === 'warning'
                          ? 'warning'
                          : 'info'
                    }
                  >
                    {formatDateTime(entry.at)}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageStack>
  )
}
