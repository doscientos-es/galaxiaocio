import {
  Badge,
  Button,
  Card,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
  PageStack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableNumber,
  TableRow,
} from '@doscientos/ui'
import { Link } from '@tanstack/react-router'
import { PackageCheck, PackagePlus } from 'lucide-react'
import { useState } from 'react'

import { formatCents, formatKg } from '@/shared/lib/format'

import type { Product } from '../application/product'
import type { StockPurchase } from '../application/purchase'
import { useCatalog } from '../application/use-catalog'
import { PurchaseDialog } from './purchase-dialog'
import { RestockDialog } from './restock-dialog'

/** An order that cannot continue until a product is available. */
export interface WaitingOrder {
  id: string
  reference: string
  missing: number
}

function WaitingOrders({ orders }: { orders: WaitingOrder[] }) {
  if (orders.length === 0) return <span className="text-muted-foreground text-xs">—</span>
  return (
    <ul className="flex flex-wrap gap-1.5">
      {orders.map((order) => (
        <li key={order.id}>
          <Link to="/pedidos/$orderId" params={{ orderId: order.id }}>
            <Badge variant="warning">
              {order.reference} · faltan {order.missing}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function StockCell({ product }: { product: Product }) {
  if (product.fulfillment === 'external_supplier') {
    return <Badge variant="info">Proveedor: {product.supplier}</Badge>
  }
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <TableNumber>{product.stock}</TableNumber>
      {product.stock <= product.minStock ? <Badge variant="warning">Stock bajo</Badge> : null}
    </span>
  )
}

interface StockPageProps {
  /** Orders blocked by missing stock, grouped by SKU. Computed by the app, which knows both features. */
  waitingBySku?: Record<string, WaitingOrder[]>
  onPurchase: (purchase: StockPurchase) => Promise<void>
}

export function StockPage({ waitingBySku = {}, onPurchase }: StockPageProps) {
  const { products, suppliers, restock } = useCatalog()
  const [restocking, setRestocking] = useState<Product>()
  const [ordering, setOrdering] = useState<Product>()

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Control de stock</PageHeaderTitle>
          <PageHeaderDescription>
            Consulta el stock, pide artículos a sus proveedores y registra las recepciones.
          </PageHeaderDescription>
        </PageHeaderHeading>
      </PageHeader>
      <Card className="py-0">
        <Table density="comfortable">
          <TableHeader>
            <TableRow>
              <TableHead>Artículo</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Peso</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Pedidos esperando</TableHead>
              <TableHead className="w-px text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-muted-foreground text-xs">{product.sku}</p>
                </TableCell>
                <TableCell>
                  <TableNumber>{formatCents(product.priceCents)}</TableNumber>
                </TableCell>
                <TableCell>
                  <TableNumber>{formatKg(product.weightKg)}</TableNumber>
                </TableCell>
                <TableCell className="text-right">
                  <StockCell product={product} />
                </TableCell>
                <TableCell>
                  <WaitingOrders orders={waitingBySku[product.sku] ?? []} />
                </TableCell>
                <TableCell className="w-px">
                  <div className="grid w-max grid-cols-[8rem_10rem] items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Pedir más ${product.name}`}
                      onPress={() => setOrdering(product)}
                    >
                      <PackagePlus aria-hidden />
                      Pedir stock
                    </Button>
                    {product.fulfillment === 'own_stock' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Registrar recepción de ${product.name}`}
                        onPress={() => setRestocking(product)}
                      >
                        <PackageCheck aria-hidden />
                        Registrar recepción
                      </Button>
                    ) : <span aria-hidden />}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <RestockDialog
        key={restocking?.id ?? 'closed'}
        product={restocking}
        onClose={() => setRestocking(undefined)}
        onSave={restock}
      />
      <PurchaseDialog
        open={ordering !== undefined}
        onClose={() => setOrdering(undefined)}
        suppliers={suppliers}
        onPurchase={onPurchase}
        lines={
          ordering
            ? [
              {
                sku: ordering.sku,
                name: ordering.name,
                requested: 1,
                available: 0,
                missing: 1,
                status: 'shortage',
                supplier: ordering.supplier,
              },
            ]
            : []
        }
      />
    </PageStack>
  )
}
