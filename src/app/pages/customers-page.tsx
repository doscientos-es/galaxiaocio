import {
  Card,
  EmptyState,
  EmptyStateDescription,
  EmptyStateHeader,
  EmptyStateTitle,
  PageHeader,
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
} from '@doscientos/ui'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { useOrders } from '@/features/orders'
import { formatDate } from '@/shared/lib/format'
import { matchesSearch } from '@/shared/lib/search'
import { ListControls } from '@/shared/ui/list-controls'
import { ListPagination, useListPagination } from '@/shared/ui/list-pagination'

type CustomerFilter = 'all' | 'with-orders' | 'without-orders'
const labels: Record<CustomerFilter, string> = {
  all: 'Todos', 'with-orders': 'Con pedidos', 'without-orders': 'Sin pedidos',
}

/** The customer database: every validated order saves its customer here, once. */
export function CustomersPage() {
  const { customers, orders, customersLoading, isLoading } = useOrders()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CustomerFilter>('all')
  const orderCounts = new Map<string, number>()
  for (const order of orders) {
    if (order.customerId) orderCounts.set(order.customerId, (orderCounts.get(order.customerId) ?? 0) + 1)
  }
  const matching = customers.filter((customer) => matchesSearch(query, [customer.name, customer.taxId, customer.email, customer.phone]))
  const withOrders = matching.filter((customer) => orderCounts.has(customer.id)).length
  const visible = matching.filter((customer) => filter === 'all' || orderCounts.has(customer.id) === (filter === 'with-orders'))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const pagination = useListPagination(visible, JSON.stringify([query, filter]))

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Clientes</PageHeaderTitle>
          <PageHeaderDescription>
            Cada pedido validado guarda su cliente una sola vez. Los siguientes pedidos lo reconocen
            por NIF o email.
          </PageHeaderDescription>
        </PageHeaderHeading>
      </PageHeader>
      {customersLoading || isLoading ? <output>Cargando clientes…</output> : <>
      <ListControls
        query={query} onQueryChange={(value) => { setQuery(value); pagination.setPage(1) }}
        searchLabel="Buscar clientes" placeholder="Buscar por nombre, NIF, email o teléfono"
        filterLabel="Filtrar clientes" selected={filter}
        onFilterChange={(value) => { setFilter(value); pagination.setPage(1) }}
        filters={[
          { id: 'all', label: labels.all, count: matching.length },
          { id: 'with-orders', label: labels['with-orders'], count: withOrders },
          { id: 'without-orders', label: labels['without-orders'], count: matching.length - withOrders },
        ]}
      />
      {visible.length === 0 ? (
        <EmptyState>
          <EmptyStateHeader>
            <EmptyStateTitle>{customers.length ? 'No hay clientes en esta vista' : 'Aún no hay clientes'}</EmptyStateTitle>
            <EmptyStateDescription>
              {customers.length ? 'Prueba con otra búsqueda o cambia el filtro.' : 'Se guardan automáticamente al validar el primer pedido.'}
            </EmptyStateDescription>
          </EmptyStateHeader>
        </EmptyState>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>NIF / CIF</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-right">Pedidos</TableHead>
                <TableHead>Desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.items.map((customer) => {
                const count = orderCounts.get(customer.id) ?? 0
                return (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium"><Link to="/clientes/$customerId" params={{ customerId: customer.id }} className="text-primary underline-offset-4 hover:underline">{customer.name}</Link></TableCell>
                    <TableCell>{customer.taxId || '—'}</TableCell>
                    <TableCell>
                      <p>{customer.email || '—'}</p>
                      <p className="text-muted-foreground text-xs">{customer.phone}</p>
                    </TableCell>
                    <TableCell>
                      {count ? (
                        <TableNumber>
                          <Link
                            to="/clientes/$customerId"
                            params={{ customerId: customer.id }}
                            className="underline-offset-4 hover:underline"
                          >
                            {count}
                          </Link>
                        </TableNumber>
                      ) : (
                        <TableNumber>0</TableNumber>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(customer.createdAt)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
      <ListPagination controller={pagination} singular="cliente" plural="clientes" />
      </>}
    </PageStack>
  )
}
