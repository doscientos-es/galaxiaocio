import { createFileRoute } from '@tanstack/react-router'

import { CustomerDetailPage } from '@/app/pages/customer-detail-page'

export const Route = createFileRoute('/clientes_/$customerId')({
  component: function CustomerRoute() {
    const { customerId } = Route.useParams()
    return <CustomerDetailPage customerId={customerId} />
  },
})