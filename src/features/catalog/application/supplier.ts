import { z } from 'zod'

export const supplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  url: z.string(),
})

export type Supplier = z.infer<typeof supplierSchema>

export const supplierId = (name: string) => name.trim().toLocaleLowerCase('es')
