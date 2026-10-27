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

export const isOrderFilter = (value: string): value is OrderFilter => value in orderFilterLabels
