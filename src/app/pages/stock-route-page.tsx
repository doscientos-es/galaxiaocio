import { evaluateStock, StockPage, useCatalog, type WaitingOrder } from '@/features/catalog'
import { useOrders } from '@/features/orders'

/**
 * Stock screen with the orders each shortage is holding up. It lives in the app layer because
 * it needs both the catalog (stock) and the orders feature, which must not depend on each other.
 */
export function StockRoutePage() {
  const { orders } = useOrders()
  const { products } = useCatalog()

  const waitingBySku: Record<string, WaitingOrder[]> = {}
  for (const order of orders.filter((candidate) => candidate.stage === 'stored')) {
    const evaluation = evaluateStock(order.lines, products, {
      supplierReceived: order.supplierStatus === 'received',
    })
    for (const line of evaluation.lines.filter((item) => item.status === 'shortage')) {
      const waiting = waitingBySku[line.sku] ?? []
      waiting.push({ id: order.id, reference: order.reference, missing: line.missing })
      waitingBySku[line.sku] = waiting
    }
  }

  return <StockPage waitingBySku={waitingBySku} />
}
