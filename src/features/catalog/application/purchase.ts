import type { StockLineResult } from './stock'
import { supplierId, type Supplier } from './supplier'

export interface PurchaseGroup {
  name: string | null
  supplier: Supplier | undefined
  lines: StockLineResult[]
}

export interface StockPurchase {
  supplier: string
  description: string
  reference: string
  netCents: number
  vatCents: number
}

export function groupMissingBySupplier(
  lines: StockLineResult[],
  suppliers: Supplier[],
): PurchaseGroup[] {
  const groups = new Map<string, PurchaseGroup>()
  for (const line of lines.filter((item) => item.missing > 0 && item.status !== 'ok')) {
    const key = line.supplier ? supplierId(line.supplier) : ''
    let group = groups.get(key)
    if (!group) {
      group = {
        name: line.supplier,
        supplier: suppliers.find((supplier) => supplier.id === key),
        lines: [],
      }
      groups.set(key, group)
    }
    group.lines.push(line)
  }
  return Array.from(groups.values())
}

export function purchaseMessage(reference: string, group: PurchaseGroup): string {
  const items = group.lines
    .map((line) => `- ${line.missing} × ${line.name} (${line.sku || 'sin referencia'})`)
    .join('\n')
  return `Hola,\n\nNecesitamos los siguientes artículos para el pedido ${reference}:\n${items}\n\n¿Podéis confirmarnos disponibilidad, precio y plazo de entrega?\n\nGracias.`
}

export function safeSupplierUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : undefined
  } catch {
    return undefined
  }
}
