import {
  Button,
  Card,
  ConfirmDialog,
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
  toast,
} from '@doscientos/ui'
import { Link, useNavigate } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { evaluateStock, orderTotals, StockStatusBadge, useCatalog } from '@/features/catalog'
import { useShipping } from '@/features/shipping'
import { formatCents, formatDateTime } from '@/shared/lib/format'
import { ListControls } from '@/shared/ui/list-controls'
import { ListPagination, useListPagination } from '@/shared/ui/list-pagination'

import {
  filterOrders,
  matchesOrderSearch,
  orderFilterOptions,
  type OrderFilter,
} from '../application/order-filters'
import type { Order } from '../application/order'
import { isEditable } from '../application/order-workflow'
import { useOrders } from '../application/use-orders'
import { ChannelLabel } from './channel-label'
import { NewOrderDialog } from './new-order-dialog'
import { OrderCustomerLink } from './order-customer-link'
import { OrderStageBadge } from './order-stage-badge'

export function OrdersPage() {
  const navigate = useNavigate()
  const { orders, customers, deleteOrder } = useOrders()
  const customerIds = new Set(customers.map((customer) => customer.id))
  const { products } = useCatalog()
  const { shipmentFor } = useShipping()
  const [filter, setFilter] = useState<OrderFilter>('all')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [manualEntry, setManualEntry] = useState(false)
  const [removing, setRemoving] = useState<Order>()
  const [deleting, setDeleting] = useState(false)

  const matching = orders.filter((order) =>
    matchesOrderSearch(order, query, shipmentFor(order.id)?.trackingNumber),
  )
  const visible = filterOrders(matching, filter)
  const pagination = useListPagination(visible, JSON.stringify([query, filter]))
  const open = (orderId: string) => void navigate({ to: '/pedidos/$orderId', params: { orderId } })

  async function confirmDelete() {
    if (!removing || deleting) return
    setDeleting(true)
    try {
      const deleted = await deleteOrder(removing.id)
      setRemoving(undefined)
      if (deleted) toast.success('Pedido eliminado del listado')
      else toast.info('El pedido ya no está disponible')
    } catch (error) {
      toast.error('No se ha podido eliminar el pedido', {
        description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {!manualEntry ? <PageStack>
        <PageHeader>
          <PageHeaderHeading>
            <PageHeaderTitle>Pedidos</PageHeaderTitle>
            <PageHeaderDescription>
              Todos los canales en un único lugar: web, email, formulario y WhatsApp.
            </PageHeaderDescription>
          </PageHeaderHeading>
          <PageHeaderActions>
            <Button onPress={() => setCreating(true)}>
              <Plus aria-hidden />
              Nuevo pedido
            </Button>
          </PageHeaderActions>
        </PageHeader>
        <ListControls
          query={query} onQueryChange={(value) => { setQuery(value); pagination.setPage(1) }}
          searchLabel="Buscar pedidos" placeholder="Buscar por cliente, referencia o seguimiento"
          filterLabel="Filtrar pedidos" selected={filter}
          onFilterChange={(value) => { setFilter(value); pagination.setPage(1) }}
          filters={orderFilterOptions(matching)}
        />
        {visible.length === 0 ? (
          <EmptyState>
            <EmptyStateHeader>
              <EmptyStateTitle>No hay pedidos en esta vista</EmptyStateTitle>
              <EmptyStateDescription>Prueba con otro dato o cambia el filtro.</EmptyStateDescription>
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
                  <TableHead className="w-0"><span className="sr-only">Acciones</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((order) => {
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
                      <TableCell><OrderCustomerLink order={order} customerIds={customerIds} /></TableCell>
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
                          <OrderStageBadge stage={order.stage} deliveredAt={order.deliveredAt} />
                          {order.stage === 'stored' && stock.status !== 'ok' ? (
                            <StockStatusBadge status={stock.status} />
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Eliminar pedido ${order.reference}`}
                          isDisabled={!isEditable(order)}
                          onPress={() => setRemoving(order)}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}
        {visible.length > 0 ? (
          <div className="grid gap-2">
            <ListPagination controller={pagination} singular="pedido" plural="pedidos" />
            <p className="text-muted-foreground text-xs">Solo se pueden eliminar pedidos que aún no se han preparado para expedición.</p>
          </div>
        ) : null}
        <ConfirmDialog
          open={removing !== undefined}
          onOpenChange={(open) => !open && setRemoving(undefined)}
          title={`Eliminar ${removing?.reference ?? 'pedido'}`}
          description="El pedido desaparecerá del listado. Se conservará un registro local y no se eliminará el cliente."
          confirmLabel="Eliminar pedido"
          destructive
          pending={deleting}
          onConfirm={() => void confirmDelete()}
        />
      </PageStack> : null}
      <NewOrderDialog
        open={creating}
        onOpenChange={setCreating}
        manual={manualEntry}
        onManualChange={setManualEntry}
        onCreated={(order) => open(order.id)}
      />
    </>
  )
}
