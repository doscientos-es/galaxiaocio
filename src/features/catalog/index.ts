export { CatalogProvider } from './application/catalog-repository'
export type { CatalogRepository } from './application/catalog-repository'
export type { Product } from './application/product'
export {
  evaluateStock,
  reserveStock,
  restockProduct,
  type StockEvaluation,
  type StockLine,
  type StockLineResult,
  type StockStatus,
  type SupplierStatus,
} from './application/stock'
export { orderTotals } from './application/pricing'
export {
  InsufficientStockError,
  reserveFromCollection,
  restockInCollection,
} from './application/reserve'
export { useCatalog } from './application/use-catalog'
export { createLocalCatalogRepository } from './infrastructure/local-catalog-repository'
export { StockPage, type WaitingOrder } from './ui/stock-page'
export { StockPanel } from './ui/stock-panel'
export { StockStatusBadge } from './ui/stock-status-badge'
