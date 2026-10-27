import type { Order } from '@/features/orders'

import type { Shipment } from '../application/carrier'
import { useShipping } from '../application/use-shipping'
import { ShipmentSummary } from './shipment-summary'
import { ShippingPlanner } from './shipping-planner'

interface ShippingPanelProps {
  order: Order
  /** Called after the shipment is saved so the app can move the order forward. */
  onShipped: (shipment: Shipment) => Promise<void>
}

export function ShippingPanel({ order, onShipped }: ShippingPanelProps) {
  const { shipmentFor } = useShipping()
  const shipment = shipmentFor(order.id)
  return shipment ? (
    <ShipmentSummary order={order} shipment={shipment} />
  ) : (
    <ShippingPlanner order={order} onShipped={onShipped} />
  )
}
