import { ToastProvider } from '@doscientos/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { BillingProvider } from '@/features/billing'
import { CatalogProvider } from '@/features/catalog'
import { OrdersProvider } from '@/features/orders'
import { ShippingProvider } from '@/features/shipping'

import { repositories } from './repositories'

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity, retry: false } },
})

/** Injects each feature's repository. Nothing below this line knows where data is stored. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <CatalogProvider repository={repositories.catalog}>
          <OrdersProvider repository={repositories.orders}>
            <ShippingProvider repository={repositories.shipping}>
              <BillingProvider repository={repositories.billing}>{children}</BillingProvider>
            </ShippingProvider>
          </OrdersProvider>
        </CatalogProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
