import { Badge, type BadgeProps } from '@doscientos/ui'

import type { StockStatus } from '../application/stock'

const presentation: Record<StockStatus, { label: string; variant: BadgeProps['variant'] }> = {
  ok: { label: 'Stock suficiente', variant: 'success' },
  shortage: { label: 'Sin stock suficiente', variant: 'warning' },
  external: { label: 'Pedir a proveedor', variant: 'info' },
  unknown: { label: 'Artículo sin identificar', variant: 'danger' },
}

export function StockStatusBadge({ status }: { status: StockStatus }) {
  const { label, variant } = presentation[status]
  return <Badge variant={variant}>{label}</Badge>
}
