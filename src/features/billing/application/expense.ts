import { z } from 'zod'

export const expenseSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1),
  supplier: z.string(),
  netCents: z.number().int().min(0),
  vatCents: z.number().int().min(0),
  source: z.enum(['manual', 'stock']),
  reference: z.string(),
})

export type Expense = z.infer<typeof expenseSchema>

/** A local calendar date, without UTC conversion shifting the selected day. */
export function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
