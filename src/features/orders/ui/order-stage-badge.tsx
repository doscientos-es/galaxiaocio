import { Badge, type BadgeProps } from '@doscientos/ui'

import { stageLabels, type OrderStage } from '../application/order'

const variants: Record<OrderStage, BadgeProps['variant']> = {
  review: 'warning',
  incomplete: 'danger',
  stored: 'info',
  ready: 'default',
  shipped: 'success',
  closed: 'neutral',
}

export function OrderStageBadge({
  stage,
  deliveredAt,
}: {
  stage: OrderStage
  deliveredAt?: string | undefined
}) {
  return (
    <Badge variant={deliveredAt ? 'success' : variants[stage]}>
      {deliveredAt ? 'Recibido' : stageLabels[stage]}
    </Badge>
  )
}
