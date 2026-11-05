import {
  Card, CardContent, CardHeader, CardTitle, DataViewState, DataViewStateActions,
  DataViewStateDescription, DataViewStateTitle, PageHeader, PageHeaderActions,
  PageHeaderDescription, PageHeaderHeading, PageHeaderTitle, PageStack, Table, TableBody,
  TableCell, TableHead, TableHeader, TableRow,
} from '@doscientos/ui'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { ChannelLabel, filterOrders, matchesOrderSearch, orderFilterOptions, OrderStageBadge, useOrders, type OrderFilter } from '@/features/orders'
import { useShipping } from '@/features/shipping'
import { formatDate, formatDateTime } from '@/shared/lib/format'
import { ListControls } from '@/shared/ui/list-controls'
import { ListPagination, useListPagination } from '@/shared/ui/list-pagination'

export function CustomerDetailPage({ customerId }: { customerId: string }) {
  const { customers, orders, customersLoading, isLoading } = useOrders()
  const { shipmentFor } = useShipping()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<OrderFilter>('all')
  const own = orders.filter((order) => order.customerId === customerId)
  const matching = own.filter((order) => matchesOrderSearch(order, query, shipmentFor(order.id)?.trackingNumber))
  const visible = filterOrders(matching, filter)
  const pagination = useListPagination(visible, JSON.stringify([customerId, query, filter]))
  const customer = customers.find((item) => item.id === customerId)
  if (customersLoading) return <output>Cargando cliente…</output>
  if (!customer) {
    return (
      <DataViewState>
        <DataViewStateTitle>Cliente no encontrado</DataViewStateTitle>
        <DataViewStateDescription>El cliente no está disponible.</DataViewStateDescription>
        <DataViewStateActions><Link to="/clientes" className="text-sm underline">Volver a clientes</Link></DataViewStateActions>
      </DataViewState>
    )
  }
  const phone = customer.phone.replace(/[^+0-9]/g, '')

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>{customer.name || 'Cliente sin identificar'}</PageHeaderTitle>
          <PageHeaderDescription>Cliente desde {formatDate(customer.createdAt)}</PageHeaderDescription>
        </PageHeaderHeading>
        <PageHeaderActions><Link to="/clientes" className="text-sm underline">Volver a clientes</Link></PageHeaderActions>
      </PageHeader>
      <Card>
        <CardHeader><CardTitle>Datos de contacto</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>NIF / CIF: {customer.taxId || 'No indicado'}</p>
          {phone ? <a className="text-primary break-all underline" href={`tel:${phone}`}>{customer.phone}</a> : <p>Sin teléfono</p>}
          {customer.email ? <a className="text-primary break-all underline" href={`mailto:${encodeURIComponent(customer.email)}`}>{customer.email}</a> : <p>Sin email</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{isLoading ? 'Pedidos' : `Pedidos (${own.length})`}</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          {isLoading ? <output>Cargando pedidos…</output> : <>
            <ListControls
              query={query} onQueryChange={(value) => { setQuery(value); pagination.setPage(1) }}
              searchLabel="Buscar pedidos del cliente" placeholder="Buscar por referencia o seguimiento"
              filterLabel="Filtrar pedidos del cliente" selected={filter}
              onFilterChange={(value) => { setFilter(value); pagination.setPage(1) }}
              filters={orderFilterOptions(matching)}
            />
            {visible.length ? (
              <Table>
                <TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Fecha</TableHead><TableHead>Canal</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pagination.items.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell><Link to="/pedidos/$orderId" params={{ orderId: order.id }} className="text-primary underline-offset-4 hover:underline">{order.reference}</Link></TableCell>
                      <TableCell>{formatDateTime(order.receivedAt)}</TableCell>
                      <TableCell><ChannelLabel channel={order.channel} marketplace={order.marketplace} /></TableCell>
                      <TableCell><OrderStageBadge stage={order.stage} deliveredAt={order.deliveredAt} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-muted-foreground text-sm">{own.length ? 'No hay pedidos en esta vista. Prueba con otra búsqueda o filtro.' : 'Este cliente no tiene pedidos.'}</p>}
            <ListPagination controller={pagination} singular="pedido" plural="pedidos" />
          </>}
        </CardContent>
      </Card>
    </PageStack>
  )
}