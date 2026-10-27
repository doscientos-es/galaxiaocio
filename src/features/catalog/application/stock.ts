import type { Product } from './product'

export interface StockLine {
  sku: string
  quantity: number
}

export type StockLineStatus = 'ok' | 'shortage' | 'external' | 'unknown'
export type StockStatus = StockLineStatus

export interface StockLineResult {
  sku: string
  name: string
  requested: number
  available: number
  missing: number
  status: StockLineStatus
  supplier: string | null
}

export interface StockEvaluation {
  status: StockStatus
  lines: StockLineResult[]
}

/** Progress of the purchase from an external supplier, tracked on the order. */
export type SupplierStatus = 'none' | 'notified' | 'received'

export interface StockOptions {
  /** Supplier-only items count as available once the supplier has delivered them. */
  supplierReceived?: boolean
}

function evaluateLine(
  line: StockLine,
  product: Product | undefined,
  options: StockOptions,
): StockLineResult {
  if (!product) {
    return {
      sku: line.sku,
      name: line.sku || 'Artículo sin identificar',
      requested: line.quantity,
      available: 0,
      missing: line.quantity,
      status: 'unknown',
      supplier: null,
    }
  }
  if (product.fulfillment === 'external_supplier') {
    const received = options.supplierReceived === true
    return {
      sku: product.sku,
      name: product.name,
      requested: line.quantity,
      available: received ? line.quantity : 0,
      missing: received ? 0 : line.quantity,
      status: received ? 'ok' : 'external',
      supplier: product.supplier,
    }
  }
  const missing = Math.max(0, line.quantity - product.stock)
  return {
    sku: product.sku,
    name: product.name,
    requested: line.quantity,
    available: product.stock,
    missing,
    status: missing > 0 ? 'shortage' : 'ok',
    supplier: product.supplier,
  }
}

/**
 * Follows the agreed flow: a supplier-only item takes priority (the team must order it);
 * otherwise check own stock and list exactly which items are missing.
 */
export function evaluateStock(
  lines: StockLine[],
  products: Product[],
  options: StockOptions = {},
): StockEvaluation {
  const bySku = new Map(products.map((product) => [product.sku, product]))
  const results = lines.map((line) => evaluateLine(line, bySku.get(line.sku), options))
  const status = (['unknown', 'external', 'shortage'] as const).find((candidate) =>
    results.some((result) => result.status === candidate),
  )
  return { status: status ?? 'ok', lines: results }
}

/** Returns the products whose stock changes when an order is prepared for shipping. */
export function reserveStock(products: Product[], lines: StockLine[]): Product[] {
  return lines.flatMap((line) => {
    const product = products.find((candidate) => candidate.sku === line.sku)
    if (!product || product.fulfillment === 'external_supplier') return []
    return [{ ...product, stock: Math.max(0, product.stock - line.quantity) }]
  })
}

export function restockProduct(product: Product, quantity: number): Product {
  return { ...product, stock: product.stock + Math.max(0, Math.trunc(quantity)) }
}
