import { channelLabels, marketplaceLabels, stageLabels, type Order } from '@/features/orders'
import type { Shipment } from '@/features/shipping'
import { toCsv } from '@/shared/lib/csv'

import { documentKindLabels, type BillingDocument } from './document'

export interface ExportFile {
  fileName: string
  content: string
}

const euros = (cents: number): string => (cents / 100).toFixed(2).replace('.', ',')
const day = (iso: string): string => iso.slice(0, 10)

/** Example CSV pack for the accountant. The real column layout is agreed with the gestor. */
export function buildGestorExport(
  orders: Order[],
  documents: BillingDocument[],
  shipments: Shipment[],
  now: Date,
): ExportFile[] {
  const stamp = day(now.toISOString())
  const reference = (orderId: string) =>
    orders.find((order) => order.id === orderId)?.reference ?? ''
  return [
    {
      fileName: `pedidos-${stamp}.csv`,
      content: toCsv(
        [
          'Referencia',
          'Fecha',
          'Canal',
          'Plataforma',
          'Cliente',
          'NIF',
          'Dirección',
          'CP',
          'Población',
          'Estado',
        ],
        orders.map((order) => [
          order.reference,
          day(order.receivedAt),
          channelLabels[order.channel],
          order.marketplace ? marketplaceLabels[order.marketplace] : '',
          order.customer.name,
          order.customer.taxId,
          order.address.street,
          order.address.postalCode,
          order.address.city,
          stageLabels[order.stage],
        ]),
      ),
    },
    {
      fileName: `albaranes-facturas-${stamp}.csv`,
      content: toCsv(
        [
          'Número',
          'Tipo',
          'Fecha',
          'Pedido',
          'Cliente',
          'NIF',
          'Base',
          'IVA',
          'Total',
          'Observaciones',
        ],
        documents.map((document) => [
          document.number,
          documentKindLabels[document.kind],
          day(document.issuedAt),
          document.orderReference,
          document.customerName,
          document.customerTaxId,
          euros(document.netCents),
          euros(document.vatCents),
          euros(document.totalCents),
          document.note,
        ]),
      ),
    },
    {
      fileName: `expediciones-${stamp}.csv`,
      content: toCsv(
        ['Pedido', 'Fecha', 'Agencia', 'Seguimiento', 'Bultos', 'Peso (kg)', 'Coste', 'Ahorro'],
        shipments.map((shipment) => [
          reference(shipment.orderId),
          day(shipment.createdAt),
          shipment.carrierName,
          shipment.trackingNumber,
          shipment.packages,
          shipment.weightKg.toFixed(1).replace('.', ','),
          euros(shipment.costCents),
          euros(shipment.savedCents),
        ]),
      ),
    },
  ]
}
