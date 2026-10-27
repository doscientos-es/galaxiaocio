import { createRepositoryContext } from '@/shared/lib/data/repository-context'
import type { Collection } from '@/shared/lib/storage/collection'

import type { Activity, Customer, IntakeDraft, Order, OrderChannel } from './order'

/** Where new orders come from (webhooks, mailbox, WhatsApp…). The demo simulates it. */
export interface IncomingOrderSource {
  fetch(channel: OrderChannel): Promise<IntakeDraft>
}

/** Persistence and intake ports of the orders feature. */
export interface OrdersRepository {
  orders: Collection<Order>
  customers: Collection<Customer>
  activity: Collection<Activity>
  incoming: IncomingOrderSource
}

export const [OrdersProvider, useOrdersRepository] =
  createRepositoryContext<OrdersRepository>('pedidos')
