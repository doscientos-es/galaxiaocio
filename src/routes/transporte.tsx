import { createFileRoute } from '@tanstack/react-router'

import { ShippingPage } from '@/features/shipping'

export const Route = createFileRoute('/transporte')({ component: ShippingPage })
