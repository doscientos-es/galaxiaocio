import { useMemo } from 'react'

import { useCatalog } from '@/features/catalog'
import { useCollection } from '@/shared/lib/data/use-collection'
import { createId } from '@/shared/lib/ids'

import {
  channelLabels,
  type Activity,
  type IntakeDraft,
  type Order,
  type OrderChannel,
  type OrderEdit,
  type OrderStage,
} from './order'
import {
  advanceOrder,
  confirmReview,
  createOrder,
  editOrder,
  findOrCreateCustomer,
  nextSequence,
} from './order-workflow'
import { useOrdersRepository } from './orders-repository'

type ActivityEntry = Omit<Activity, 'id' | 'at'>

/** Single entry point for the orders feature: data, and every action that changes an order. */
export function useOrders() {
  const repository = useOrdersRepository()
  const { products } = useCatalog()
  const orders = useCollection('orders', repository.orders)
  const customers = useCollection('customers', repository.customers)
  const activity = useCollection('activity', repository.activity)
  const knownSkus = useMemo(() => new Set(products.map((product) => product.sku)), [products])

  const logActivity = (entry: ActivityEntry) =>
    activity.upsert({ ...entry, id: createId('act'), at: new Date().toISOString() })

  /**
   * Saves the order. The first time it is validated the customer is registered; if the data is
   * corrected afterwards, the saved customer is updated too.
   */
  async function persist(order: Order): Promise<Order> {
    let next = order
    if (next.stage !== 'review' && next.stage !== 'incomplete') {
      if (next.customerId === null) {
        // Atomic: two orders from the same new customer must not create two customers.
        const customer = await repository.customers.mutate((saved) => {
          const found = findOrCreateCustomer(next.customer, saved, new Date())
          return {
            items: found.isNew ? [found.customer, ...saved] : saved,
            result: found.customer,
          }
        })
        await customers.refresh()
        next = { ...next, customerId: customer.id }
      } else {
        const saved = await repository.customers.list()
        const current = saved.find((customer) => customer.id === next.customerId)
        const fields = ['name', 'taxId', 'email', 'phone'] as const
        if (current && fields.some((field) => current[field] !== next.customer[field])) {
          await customers.upsert({ ...current, ...next.customer })
        }
      }
    }
    await orders.upsert(next)
    return next
  }

  /** Always works on the stored order, never on a copy that may have gone stale on screen. */
  const latest = async (order: Order): Promise<Order> =>
    (await repository.orders.get(order.id)) ?? order

  const report = (order: Order, previous: OrderStage | null) => {
    if (order.stage === previous) return Promise.resolve()
    const completed = order.stage === 'stored'
    return logActivity({
      title: completed ? 'Pedido registrado' : 'Pedido con datos incompletos',
      detail: `${order.reference} · ${order.customer.name || 'Cliente sin identificar'}`,
      tone: completed ? 'success' : 'warning',
      orderId: order.id,
    })
  }

  async function receive(draft: IntakeDraft): Promise<Order> {
    // Atomic: the reference is assigned and the order saved in one step, so references never repeat.
    const created = await repository.orders.mutate((current) => {
      const draftOrder = createOrder(draft, {
        sequence: nextSequence(current),
        now: new Date(),
        knownSkus,
      })
      return { items: [draftOrder, ...current], result: draftOrder }
    })
    const order = await persist(created)
    await logActivity({
      title: `Pedido recibido por ${channelLabels[order.channel]}`,
      detail: `${order.reference} · ${order.customer.name || 'Cliente sin identificar'}`,
      tone: 'info',
      orderId: order.id,
    })
    if (order.stage !== 'review') await report(order, null)
    return order
  }

  return {
    orders: orders.items,
    customers: customers.items,
    activity: activity.items,
    isLoading: orders.isLoading,
    knownSkus,
    logActivity,
    getLatest: latest,
    receive,
    receiveFromChannel: async (channel: OrderChannel) =>
      receive(await repository.incoming.fetch(channel)),
    saveData: async (order: Order, edit: OrderEdit) => {
      const saved = await persist(editOrder(order, edit, knownSkus))
      await report(saved, order.stage)
      return saved
    },
    confirmReview: async (order: Order, edit: OrderEdit) => {
      const saved = await persist(confirmReview(order, edit, knownSkus))
      await report(saved, order.stage)
      return saved
    },
    /** Moves the order forward once. Repeating the same step (double click) changes nothing. */
    advance: async (order: Order, to: OrderStage) => {
      const current = await latest(order)
      return current.stage === to ? current : persist(advanceOrder(current, to))
    },
    setSupplierStatus: async (order: Order, supplierStatus: Order['supplierStatus']) =>
      persist({ ...(await latest(order)), supplierStatus }),
  }
}
