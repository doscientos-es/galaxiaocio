import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableNumber,
  TableRow,
} from '@doscientos/ui'
import { Link } from '@tanstack/react-router'
import { BellRing } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import {
  evaluateStock,
  type StockLine,
  type SupplierStatus,
} from '../application/stock'
import { useCatalog } from '../application/use-catalog'
import type { StockPurchase } from '../application/purchase'
import { PurchaseDialog } from './purchase-dialog'
import { StockStatusBadge } from './stock-status-badge'

interface StockPanelProps {
  /** Order reference, used in the supplier message. */
  reference: string
  lines: StockLine[]
  supplierStatus: SupplierStatus
  /** Called when the supplier has delivered the items. */
  onSupplierReceived: () => void
  onPurchase: (purchase: StockPurchase) => Promise<void>
  /** Primary action shown once stock is enough (e.g. prepare the shipment). */
  action: ReactNode
}

/** Stock and purchasing step: supplier first, then own stock, listing exactly what is missing. */
export function StockPanel({
  reference,
  lines,
  supplierStatus,
  onSupplierReceived,
  onPurchase,
  action,
}: StockPanelProps) {
  const { products, suppliers } = useCatalog()
  const [ordering, setOrdering] = useState(false)
  const evaluation = evaluateStock(lines, products, {
    supplierReceived: supplierStatus === 'received',
  })
  const external = evaluation.lines.filter((line) => line.status === 'external')
  const missing = evaluation.lines.filter((line) => line.status === 'shortage')
  const toOrder = evaluation.lines.filter((line) => line.missing > 0 && line.status !== 'ok')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock y compras</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Table density="compact">
          <TableHeader>
            <TableRow>
              <TableHead>Artículo</TableHead>
              <TableHead className="text-right">Pedido</TableHead>
              <TableHead className="text-right">Disponible</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluation.lines.map((line, index) => (
              <TableRow key={`${line.sku}-${index}`}>
                <TableCell>{line.name}</TableCell>
                <TableCell>
                  <TableNumber>{line.requested}</TableNumber>
                </TableCell>
                <TableCell>
                  <TableNumber>{line.status === 'external' ? '—' : line.available}</TableNumber>
                </TableCell>
                <TableCell>
                  {line.status === 'shortage' ? (
                    <Badge variant="warning">Faltan {line.missing}</Badge>
                  ) : (
                    <StockStatusBadge status={line.status} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {external.length > 0 ? (
          <Alert variant="info">
            <BellRing aria-hidden />
            <AlertTitle>Hay que pedir al proveedor</AlertTitle>
            <AlertDescription>
              {external.map((line) => `${line.name} (${line.supplier ?? 'proveedor'})`).join(', ')}
            </AlertDescription>
          </Alert>
        ) : null}
        {missing.length > 0 ? (
          <Alert variant="warning">
            <AlertTitle>Pedido pendiente: no hay stock suficiente</AlertTitle>
            <AlertDescription>
              Faltan {missing.map((line) => `${line.missing} × ${line.name}`).join(', ')}. Cuando se
              reponga el stock, el pedido podrá continuar.{' '}
              <Link to="/stock" className="underline underline-offset-4">
                Ir a control de stock
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pb-(--card-spacing)!">
        {toOrder.length > 0 ? (
          <Button variant="outline" onPress={() => setOrdering(true)}>
            Pedir stock faltante
          </Button>
        ) : null}
        {external.length > 0 ? (
          <Button variant="outline" onPress={onSupplierReceived}>
            Marcar como recibido del proveedor
          </Button>
        ) : null}
        {evaluation.status === 'ok' ? action : null}
      </CardFooter>
      {ordering ? <PurchaseDialog
        open
        onClose={() => setOrdering(false)}
        lines={toOrder}
        suppliers={suppliers}
        onPurchase={onPurchase}
        reference={reference}
      /> : null}
    </Card>
  )
}
