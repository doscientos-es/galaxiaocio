import { localDate, useBilling } from '@/features/billing'
import type { StockPurchase } from '@/features/catalog'
import { createId } from '@/shared/lib/ids'

export function useStockPurchase() {
  const { saveExpense } = useBilling()
  return async (purchase: StockPurchase) => {
    await saveExpense({ ...purchase, id: createId('expense'), date: localDate(new Date()), source: 'stock' })
  }
}