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

import { useOrders } from '@/features/orders'
import { formatDate } from '@/shared/lib/format'

/** The customer database: every validated order saves its customer here, once. */
export function CustomersPage() {
  const { customers, orders } = useOrders()
  const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name, 'es'))

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
      {sorted.length === 0 ? (
        <EmptyState>
          <EmptyStateHeader>
            <EmptyStateTitle>Aún no hay clientes</EmptyStateTitle>
            <EmptyStateDescription>
              Se guardan automáticamente al validar el primer pedido.
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
              {sorted.map((customer) => {
                const own = orders.filter((order) => order.customerId === customer.id)
                const last = own[0]
                return (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.taxId || '—'}</TableCell>
                    <TableCell>
                      <p>{customer.email || '—'}</p>
                      <p className="text-muted-foreground text-xs">{customer.phone}</p>
                    </TableCell>
                    <TableCell>
                      {last ? (
                        <TableNumber>
                          <Link
                            to="/pedidos/$orderId"
                            params={{ orderId: last.id }}
                            className="underline-offset-4 hover:underline"
                          >
                            {own.length}
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
    </PageStack>
  )
}
