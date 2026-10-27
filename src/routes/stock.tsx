import { createFileRoute } from '@tanstack/react-router'

import { StockRoutePage } from '@/app/pages/stock-route-page'

export const Route = createFileRoute('/stock')({ component: StockRoutePage })
