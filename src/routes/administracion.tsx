import { createFileRoute } from '@tanstack/react-router'

import { AccountingPage } from '@/features/billing'

export const Route = createFileRoute('/administracion')({ component: AccountingPage })
