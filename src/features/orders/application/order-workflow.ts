import { createId, formatReference } from '@/shared/lib/ids'

import type { Customer, CustomerData, IntakeDraft, Order, OrderEdit, OrderStage } from './order'
import { validateOrder } from './validation'

type KnownSkus = ReadonlySet<string>

const editableStages: ReadonlySet<OrderStage> = new Set(['review', 'incomplete', 'stored'])

const transitions: Partial<Record<OrderStage, OrderStage>> = {
  stored: 'ready',
  ready: 'shipped',
  shipped: 'closed',
}

export const isEditable = (order: Pick<Order, 'stage'>): boolean => editableStages.has(order.stage)

const validatedStage = (order: Order, knownSkus: KnownSkus): OrderStage =>
  validateOrder(order, knownSkus).length === 0 ? 'stored' : 'incomplete'

export function nextSequence(orders: Pick<Order, 'reference'>[]): number {
  const numbers = orders.map((order) => Number(order.reference.split('-').at(-1)) || 0)
  return Math.max(0, ...numbers) + 1
}

/** Registers a received order. WhatsApp photos wait for a human review first. */
export function createOrder(
  draft: IntakeDraft,
  context: { sequence: number; now: Date; knownSkus: KnownSkus },
): Order {
  const order: Order = {
    ...draft,
    id: createId('ord'),
    reference: formatReference('PED', context.now.getFullYear(), context.sequence),
    receivedAt: context.now.toISOString(),
    stage: 'review',
    customerId: null,
    supplierStatus: 'none',
    lines: draft.lines.map((line) => ({ ...line })),
  }
  if (draft.channel === 'whatsapp') return order
  return { ...order, stage: validatedStage(order, context.knownSkus) }
}

/** Applies a correction and re-runs the validation, except while a photo is awaiting review. */
export function editOrder(order: Order, edit: OrderEdit, knownSkus: KnownSkus): Order {
  if (!isEditable(order)) throw new Error('El pedido ya no se puede editar.')
  const edited: Order = { ...order, ...edit }
  return order.stage === 'review' ? edited : { ...edited, stage: validatedStage(edited, knownSkus) }
}

/** The person has checked the photo against the data: validate and register it. */
export function confirmReview(order: Order, edit: OrderEdit, knownSkus: KnownSkus): Order {
  if (order.stage !== 'review') return order
  const reviewed: Order = { ...order, ...edit }
  return { ...reviewed, stage: validatedStage(reviewed, knownSkus) }
}

export function advanceOrder(order: Order, to: OrderStage): Order {
  if (transitions[order.stage] !== to) {
    throw new Error(`No se puede pasar de «${order.stage}» a «${to}».`)
  }
  return { ...order, stage: to }
}

const normalise = (value: string): string => value.trim().toLowerCase()

/** The customer is saved once per tax id (or email) so repeat buyers are recognised. */
export function findOrCreateCustomer(
  data: CustomerData,
  customers: Customer[],
  now: Date,
): { customer: Customer; isNew: boolean } {
  const existing = customers.find(
    (candidate) =>
      (data.taxId.trim() !== '' && normalise(candidate.taxId) === normalise(data.taxId)) ||
      (data.email.trim() !== '' && normalise(candidate.email) === normalise(data.email)),
  )
  if (existing) return { customer: existing, isNew: false }
  return {
    customer: { ...data, id: createId('cus'), createdAt: now.toISOString() },
    isNew: true,
  }
}
