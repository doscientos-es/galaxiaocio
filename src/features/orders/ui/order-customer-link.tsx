import { Link } from '@tanstack/react-router'

import type { Order } from '../application/order'

export function OrderCustomerLink({ order, customerIds }: { order: Order; customerIds: ReadonlySet<string> }) {
  const name = order.customer.name || 'Cliente sin identificar'
  if (!order.customerId || !customerIds.has(order.customerId)) return <span>{name}</span>
  return (
    <Link
      to="/clientes/$customerId"
      params={{ customerId: order.customerId }}
      className="text-primary underline-offset-4 hover:underline focus-visible:underline"
      onClick={(event) => event.stopPropagation()}
    >
      {name}
    </Link>
  )
}