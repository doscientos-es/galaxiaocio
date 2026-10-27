import { createFileRoute } from '@tanstack/react-router'

import { OrderDetailPage } from '@/app/pages/order-detail-page'

export const Route = createFileRoute('/pedidos/$orderId')({
  component: function OrderRoute() {
    const { orderId } = Route.useParams()
    return <OrderDetailPage orderId={orderId} />
  },
})
