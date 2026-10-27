import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CopyButton,
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
import type { ReactNode } from 'react'

import {
  evaluateStock,
  type StockLine,
  type StockLineResult,
  type SupplierStatus,
} from '../application/stock'
import { useCatalog } from '../application/use-catalog'
import { StockStatusBadge } from './stock-status-badge'

/** Ready-to-send text so nobody has to retype what must be ordered from the supplier. */
function supplierMessage(reference: string, lines: StockLineResult[]): string {
  const supplier = lines.find((line) => line.supplier)?.supplier ?? 'proveedor'
  const items = lines.map((line) => `- ${line.requested} × ${line.name}`).join('\n')
  return `Hola, necesitamos pedir a ${supplier} para el pedido ${reference}:\n${items}\n¿Plazo de entrega?`
}

interface StockPanelProps {
  /** Order reference, used in the supplier message. */
  reference: string
  lines: StockLine[]
  supplierStatus: SupplierStatus
  /** Called when the team is asked to order the supplier-only items. */
  onNotifySupplier: (lines: StockLineResult[]) => void
  /** Called when the supplier has delivered the items. */
  onSupplierReceived: () => void
  /** Primary action shown once stock is enough (e.g. prepare the shipment). */
  action: ReactNode
}

/** Stock and purchasing step: supplier first, then own stock, listing exactly what is missing. */
export function StockPanel({
  reference,
  lines,
  supplierStatus,
  onNotifySupplier,
  onSupplierReceived,
  action,
}: StockPanelProps) {
  const { products } = useCatalog()
  const evaluation = evaluateStock(lines, products, {
    supplierReceived: supplierStatus === 'received',
  })
  const external = evaluation.lines.filter((line) => line.status === 'external')
  const missing = evaluation.lines.filter((line) => line.status === 'shortage')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock y compras</CardTitle>
        <CardDescription>
          Si algún artículo lo sirve un proveedor externo se avisa al equipo; si no, se comprueba el
          stock.
        </CardDescription>
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
        {external.length > 0 && supplierStatus === 'none' ? (
          <Button onPress={() => onNotifySupplier(external)}>
            <BellRing aria-hidden />
            Avisar al equipo
          </Button>
        ) : null}
        {external.length > 0 && supplierStatus !== 'received' ? (
          <CopyButton variant="outline" value={supplierMessage(reference, external)}>
            Copiar pedido al proveedor
          </CopyButton>
        ) : null}
        {external.length > 0 && supplierStatus === 'notified' ? (
          <>
            <Badge variant="info">Equipo avisado</Badge>
            <Button variant="outline" onPress={onSupplierReceived}>
              Marcar como recibido del proveedor
            </Button>
          </>
        ) : null}
        {evaluation.status === 'ok' ? action : null}
      </CardFooter>
    </Card>
  )
}
