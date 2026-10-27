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

export function OrderStageBadge({ stage }: { stage: OrderStage }) {
  return <Badge variant={variants[stage]}>{stageLabels[stage]}</Badge>
}
