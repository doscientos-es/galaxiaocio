import {
  Button,
  Card,
  EmptyState,
  EmptyStateDescription,
  EmptyStateHeader,
  EmptyStateTitle,
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
  PageStack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableNumber,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@doscientos/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { evaluateStock, orderTotals, StockStatusBadge, useCatalog } from '@/features/catalog'
import { formatCents, formatDateTime } from '@/shared/lib/format'

import {
  filterOrders,
  isOrderFilter,
  orderFilterLabels,
  type OrderFilter,
} from '../application/order-filters'
import { useOrders } from '../application/use-orders'
import { ChannelLabel } from './channel-label'
import { IncomingOrdersMenu } from './incoming-orders-menu'
import { NewOrderDialog } from './new-order-dialog'
import { OrderStageBadge } from './order-stage-badge'

export function OrdersPage() {
  const navigate = useNavigate()
  const { orders } = useOrders()
  const { products } = useCatalog()
  const [filter, setFilter] = useState<OrderFilter>('all')
  const [creating, setCreating] = useState(false)

  const visible = filterOrders(orders, filter)
  const open = (orderId: string) => void navigate({ to: '/pedidos/$orderId', params: { orderId } })

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Pedidos</PageHeaderTitle>
          <PageHeaderDescription>
            Todos los canales en un único lugar: web, email, formulario y WhatsApp.
          </PageHeaderDescription>
        </PageHeaderHeading>
        <PageHeaderActions>
          <IncomingOrdersMenu onReceived={(order) => open(order.id)} />
          <Button onPress={() => setCreating(true)}>
            <Plus aria-hidden />
            Nuevo pedido
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <Tabs
        selectedKey={filter}
        onSelectionChange={(key) => isOrderFilter(String(key)) && setFilter(key as OrderFilter)}
      >
        <TabsList aria-label="Filtrar pedidos">
          {(Object.keys(orderFilterLabels) as OrderFilter[]).map((key) => (
            <TabsTrigger key={key} id={key}>
              {orderFilterLabels[key]}{' '}
              <span className="text-muted-foreground tabular-nums">
                {filterOrders(orders, key).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {visible.length === 0 ? (
        <EmptyState>
          <EmptyStateHeader>
            <EmptyStateTitle>No hay pedidos en esta vista</EmptyStateTitle>
            <EmptyStateDescription>
              Cambia el filtro o recibe un pedido nuevo.
            </EmptyStateDescription>
          </EmptyStateHeader>
        </EmptyState>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead className="text-right">Artículos</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((order) => {
                const stock = evaluateStock(order.lines, products, {
                  supplierReceived: order.supplierStatus === 'received',
                })
                return (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => open(order.id)}
                  >
                    <TableCell>
                      <Link
                        to="/pedidos/$orderId"
                        params={{ orderId: order.id }}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {order.reference}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {formatDateTime(order.receivedAt)}
                      </p>
                    </TableCell>
                    <TableCell>{order.customer.name || 'Cliente sin identificar'}</TableCell>
                    <TableCell>
                      <ChannelLabel channel={order.channel} marketplace={order.marketplace} />
                    </TableCell>
                    <TableCell>
                      <TableNumber>
                        {order.lines.reduce((sum, line) => sum + line.quantity, 0)}
                      </TableNumber>
                    </TableCell>
                    <TableCell>
                      <TableNumber>
                        {formatCents(orderTotals(order.lines, products).totalCents)}
                      </TableNumber>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex flex-wrap gap-1.5">
                        <OrderStageBadge stage={order.stage} />
                        {order.stage === 'stored' && stock.status !== 'ok' ? (
                          <StockStatusBadge status={stock.status} />
                        ) : null}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
      <NewOrderDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={(order) => open(order.id)}
      />
    </PageStack>
  )
}
