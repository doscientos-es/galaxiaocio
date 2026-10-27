import { splitVat, type Totals } from '@/shared/lib/money'

import type { Product } from './product'
import type { StockLine } from './stock'

/** Amount of an order at catalog prices. Unknown items count as zero until they are identified. */
export function orderTotals(lines: StockLine[], products: Product[]): Totals {
  const bySku = new Map(products.map((product) => [product.sku, product]))
  const netCents = lines.reduce(
    (sum, line) => sum + (bySku.get(line.sku)?.priceCents ?? 0) * Math.max(0, line.quantity),
    0,
  )
  return splitVat(netCents)
}
