import { createFileRoute } from '@tanstack/react-router'

import { CustomersPage } from '@/app/pages/customers-page'

export const Route = createFileRoute('/clientes')({ component: CustomersPage })
