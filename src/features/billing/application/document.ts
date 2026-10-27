import { z } from 'zod'

export const documentKindSchema = z.enum(['delivery_note', 'invoice'])

export const documentSchema = z.object({
  id: z.string(),
  number: z.string(),
  kind: documentKindSchema,
  orderId: z.string(),
  orderReference: z.string(),
  customerName: z.string(),
  customerTaxId: z.string(),
  issuedAt: z.string(),
  lines: z.array(
    z.object({ description: z.string(), quantity: z.number(), unitCents: z.number().int() }),
  ),
  netCents: z.number().int(),
  vatCents: z.number().int(),
  totalCents: z.number().int(),
  note: z.string(),
})

export type DocumentKind = z.infer<typeof documentKindSchema>
export type BillingDocument = z.infer<typeof documentSchema>

export const documentKindLabels: Record<DocumentKind, string> = {
  delivery_note: 'Albarán',
  invoice: 'Factura',
}
