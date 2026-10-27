import { z } from 'zod'

export const productSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0),
  priceCents: z.number().int().min(0),
  weightKg: z.number().min(0),
  /** `external_supplier` products are never held in stock: the team must order them. */
  fulfillment: z.enum(['own_stock', 'external_supplier']),
  supplier: z.string().nullable(),
})

export type Product = z.infer<typeof productSchema>
