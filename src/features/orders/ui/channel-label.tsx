import { Globe, Mail, MessageCircle, PenLine, type LucideIcon } from 'lucide-react'

import {
  channelLabels,
  marketplaceLabels,
  type Marketplace,
  type OrderChannel,
} from '../application/order'

export const channelIcons: Record<OrderChannel, LucideIcon> = {
  web: Globe,
  email: Mail,
  manual: PenLine,
  whatsapp: MessageCircle,
}

export function ChannelLabel({
  channel,
  marketplace,
}: {
  channel: OrderChannel
  marketplace: Marketplace | null
}) {
  const Icon = channelIcons[channel]
  return (
    <span className="inline-flex items-center gap-2">
      <Icon aria-hidden className="text-muted-foreground size-4" />
      <span>
        {channelLabels[channel]}
        {marketplace ? (
          <span className="text-muted-foreground"> · {marketplaceLabels[marketplace]}</span>
        ) : null}
      </span>
    </span>
  )
}
