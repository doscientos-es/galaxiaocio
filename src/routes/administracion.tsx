import { createFileRoute } from '@tanstack/react-router'

import { AdministrationPage } from '@/features/billing'

export const Route = createFileRoute('/administracion')({ component: AdministrationPage })
