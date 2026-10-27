import { createFileRoute } from '@tanstack/react-router'

import { OrdersPage } from '@/features/orders'

export const Route = createFileRoute('/pedidos/')({ component: OrdersPage })
