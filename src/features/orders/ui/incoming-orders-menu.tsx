import { Button, DropdownMenu, DropdownMenuItem, toast } from '@doscientos/ui'
import { Inbox } from 'lucide-react'

import { channelLabels, type Order, type OrderChannel } from '../application/order'
import { useOrders } from '../application/use-orders'
import { channelIcons } from './channel-label'

const channels: OrderChannel[] = ['web', 'email', 'whatsapp']

/** Demo helper: simulates an order arriving through each channel. */
export function IncomingOrdersMenu({ onReceived }: { onReceived: (order: Order) => void }) {
  const { receiveFromChannel } = useOrders()

  return (
    <DropdownMenu
      trigger={
        <Button variant="outline">
          <Inbox aria-hidden />
          Recibir pedido
        </Button>
      }
      onAction={(key) => {
        const channel = channels.find((candidate) => candidate === key)
        if (!channel) return
        void receiveFromChannel(channel).then((order) => {
          toast.info(`Pedido recibido por ${channelLabels[channel]}`, {
            description: order.reference,
          })
          onReceived(order)
        })
      }}
    >
      {channels.map((channel) => {
        const Icon = channelIcons[channel]
        return (
          <DropdownMenuItem key={channel} id={channel}>
            <Icon aria-hidden />
            {channelLabels[channel]}
          </DropdownMenuItem>
        )
      })}
    </DropdownMenu>
  )
}
