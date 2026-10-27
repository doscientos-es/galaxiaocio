import type { Collection } from '@/shared/lib/storage/collection'

import type { Product } from './product'
import {
  evaluateStock,
  reserveStock,
  restockProduct,
  type StockLine,
  type SupplierStatus,
} from './stock'

/** Thrown when another order took the stock between showing the screen and confirming. */
export class InsufficientStockError extends Error {
  constructor(readonly missing: string[]) {
    super(`Ya no hay stock suficiente: ${missing.join(', ')}.`)
  }
}

/**
 * Reserves stock for an order in a single atomic step: the availability check and the
 * deduction cannot be interleaved with another order, so the same units are never sold twice.
 */
export function reserveFromCollection(
  products: Collection<Product>,
  lines: StockLine[],
  supplierStatus: SupplierStatus,
): Promise<void> {
  return products.mutate((current) => {
    const evaluation = evaluateStock(lines, current, {
      supplierReceived: supplierStatus === 'received',
    })
    if (evaluation.status !== 'ok') {
      throw new InsufficientStockError(
        evaluation.lines.filter((line) => line.status !== 'ok').map((line) => line.name),
      )
    }
    const changed = new Map(reserveStock(current, lines).map((product) => [product.id, product]))
    return {
      items: current.map((product) => changed.get(product.id) ?? product),
      result: undefined,
    }
  })
}

/** Adds received units to the current stock of a product. */
export function restockInCollection(
  products: Collection<Product>,
  sku: string,
  quantity: number,
): Promise<Product | undefined> {
  return products.mutate((current) => {
    const product = current.find((item) => item.sku === sku)
    if (!product) return { items: current, result: undefined }
    const restocked = restockProduct(product, quantity)
    return {
      items: current.map((item) => (item.id === restocked.id ? restocked : item)),
      result: restocked,
    }
  })
}
