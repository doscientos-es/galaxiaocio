import { matchesSearch } from '@/shared/lib/search'

import type { Order, OrderStage } from './order'

export type OrderFilter = 'all' | 'attention' | 'active' | 'done'

export const orderFilterLabels: Record<OrderFilter, string> = {
  all: 'Todos',
  attention: 'Requieren atención',
  active: 'En curso',
  done: 'Enviados',
}

const stagesByFilter: Record<Exclude<OrderFilter, 'all'>, ReadonlySet<OrderStage>> = {
  attention: new Set(['review', 'incomplete']),
  active: new Set(['stored', 'ready']),
  done: new Set(['shipped', 'closed']),
}

export function filterOrders(orders: Order[], filter: OrderFilter): Order[] {
  const sorted = [...orders].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
  if (filter === 'all') return sorted
  return sorted.filter((order) => stagesByFilter[filter].has(order.stage))
}

export function orderFilterOptions(orders: Order[]) {
  return (Object.keys(orderFilterLabels) as OrderFilter[]).map((id) => ({
    id, label: orderFilterLabels[id], count: filterOrders(orders, id).length,
  }))
}

export function matchesOrderSearch(order: Order, query: string, trackingNumber = ''): boolean {
  return matchesSearch(query, [
    order.reference,
    order.source?.reference ?? '',
    order.customer.name,
    order.customer.email,
    order.customer.phone,
    order.customer.taxId,
    trackingNumber,
  ])
}

export const isOrderFilter = (value: string): value is OrderFilter => value in orderFilterLabels
