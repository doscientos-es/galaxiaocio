import { z } from 'zod'

export const channelSchema = z.enum(['web', 'email', 'manual', 'whatsapp'])
export const marketplaceSchema = z.enum(['makro', 'amazon', 'leroy-merlin'])
/**
 * review      WhatsApp photo waiting for a human to check and complete the data
 * incomplete  customer, address or items are not identified yet
 * stored      validated and saved, customer registered
 * ready       stock reserved, ready to be shipped
 * shipped     transport confirmed and cost saved
 * closed      delivery note / invoice prepared for the accountant
 */
export const stageSchema = z.enum(['review', 'incomplete', 'stored', 'ready', 'shipped', 'closed'])

export const orderLineSchema = z.object({
  id: z.string(),
  sku: z.string(),
  description: z.string(),
  quantity: z.number().int().min(0),
})

export const customerDataSchema = z.object({
  name: z.string(),
  taxId: z.string(),
  email: z.string(),
  phone: z.string(),
})

export const addressSchema = z.object({
  street: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
})

export const orderSchema = z.object({
  id: z.string(),
  reference: z.string(),
  channel: channelSchema,
  /** Platform the order comes from, when an intermediary is involved. */
  marketplace: marketplaceSchema.nullable(),
  receivedAt: z.string(),
  stage: stageSchema,
  customer: customerDataSchema,
  customerId: z.string().nullable(),
  address: addressSchema,
  lines: z.array(orderLineSchema),
  /** Text read from the photo received by WhatsApp (simulated OCR). */
  whatsappPhoto: z.object({ transcript: z.array(z.string()) }).nullable(),
  notes: z.string(),
  /** Purchase from an external supplier: the team is asked, then the goods arrive. */
  supplierStatus: z.enum(['none', 'notified', 'received']).default('none'),
})

export const customerSchema = customerDataSchema.extend({ id: z.string(), createdAt: z.string() })

export const activitySchema = z.object({
  id: z.string(),
  at: z.string(),
  title: z.string(),
  detail: z.string(),
  tone: z.enum(['info', 'success', 'warning']),
  orderId: z.string().nullable(),
})

export type OrderChannel = z.infer<typeof channelSchema>
export type Marketplace = z.infer<typeof marketplaceSchema>
export type OrderStage = z.infer<typeof stageSchema>
export type OrderLine = z.infer<typeof orderLineSchema>
export type CustomerData = z.infer<typeof customerDataSchema>
export type Address = z.infer<typeof addressSchema>
export type Order = z.infer<typeof orderSchema>
export type Customer = z.infer<typeof customerSchema>
export type Activity = z.infer<typeof activitySchema>

/** What arrives from a channel before it becomes a registered order. */
export type IntakeDraft = Pick<
  Order,
  'channel' | 'marketplace' | 'customer' | 'address' | 'lines' | 'whatsappPhoto' | 'notes'
>

/** Fields a person can correct while the order is not yet ready for shipping. */
export type OrderEdit = Partial<Pick<Order, 'customer' | 'address' | 'lines' | 'notes'>>

export const channelLabels: Record<OrderChannel, string> = {
  web: 'Web propia',
  email: 'Email',
  manual: 'Formulario manual',
  whatsapp: 'WhatsApp',
}

export const marketplaceLabels: Record<Marketplace, string> = {
  makro: 'Makro',
  amazon: 'Amazon',
  'leroy-merlin': 'Leroy Merlin',
}

export const stageLabels: Record<OrderStage, string> = {
  review: 'Revisar foto',
  incomplete: 'Datos incompletos',
  stored: 'Registrado',
  ready: 'Listo para enviar',
  shipped: 'Enviado',
  closed: 'Cerrado',
}
