import {
  Button,
  Card,
  EmptyState,
  EmptyStateDescription,
  EmptyStateHeader,
  EmptyStateTitle,
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
  TableRow,
} from '@doscientos/ui'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { formatCents } from '@/shared/lib/format'
import { matchesSearch } from '@/shared/lib/search'
import { ListControls } from '@/shared/ui/list-controls'
import { ListPagination, useListPagination } from '@/shared/ui/list-pagination'

import type { Product } from '../application/product'
import { supplierId } from '../application/supplier'
import { useCatalog } from '../application/use-catalog'
import { CatalogProductDialog } from './catalog-product-dialog'

type CatalogFilter = 'all' | 'own_stock' | 'external_supplier'

export function CatalogPage() {
  const { products, suppliers, isLoading } = useCatalog()
  const [editing, setEditing] = useState<Product | 'new'>()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CatalogFilter>('all')
  const suppliersById = new Map(suppliers.map((supplier) => [supplier.id, supplier]))
  const matching = products.map((product) => ({
    product,
    supplier: suppliersById.get(supplierId(product.supplier ?? '')),
  })).filter(({ product, supplier }) => matchesSearch(query, [
    product.name, product.sku, product.supplier ?? '', supplier?.email ?? '',
  ]))
  const ownStockCount = matching.filter(({ product }) => product.fulfillment === 'own_stock').length
  const visible = matching.filter(({ product }) => filter === 'all' || product.fulfillment === filter)
  const pagination = useListPagination(visible, JSON.stringify([query, filter]))
  return (
    <PageStack>
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Catálogo</PageHeaderTitle>
          <PageHeaderDescription>
            Artículos disponibles y contactos de sus proveedores.
          </PageHeaderDescription>
        </PageHeaderHeading>
        <Button onPress={() => setEditing('new')}>
          <Plus aria-hidden /> Nuevo artículo
        </Button>
      </PageHeader>
      {isLoading ? <output>Cargando catálogo…</output> : <>
      <ListControls
        query={query} onQueryChange={(value) => { setQuery(value); pagination.setPage(1) }}
        searchLabel="Buscar artículos" placeholder="Buscar por artículo, referencia o proveedor"
        filterLabel="Filtrar artículos" selected={filter}
        onFilterChange={(value) => { setFilter(value); pagination.setPage(1) }}
        filters={[
          { id: 'all', label: 'Todos', count: matching.length },
          { id: 'own_stock', label: 'Stock propio', count: ownStockCount },
          { id: 'external_supplier', label: 'Proveedor externo', count: matching.length - ownStockCount },
        ]}
      />
      {visible.length ? <Card className="py-0">
        <Table density="comfortable">
          <TableHeader>
            <TableRow>
              <TableHead>Artículo</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Precio de venta</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.items.map(({ product, supplier }) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-muted-foreground text-xs">{product.sku} · {product.fulfillment === 'own_stock' ? 'Stock propio' : 'Proveedor externo'}</p>
                  </TableCell>
                  <TableCell>{product.supplier ?? 'Sin asignar'}</TableCell>
                  <TableCell>{supplier?.email || 'No registrado'}</TableCell>
                  <TableCell>{formatCents(product.priceCents)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Editar ${product.name}`}
                      onPress={() => setEditing(product)}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card> : (
        <EmptyState>
          <EmptyStateHeader>
            <EmptyStateTitle>{products.length ? 'No hay artículos en esta vista' : 'Aún no hay artículos'}</EmptyStateTitle>
            <EmptyStateDescription>{products.length ? 'Prueba con otra búsqueda o cambia el filtro.' : 'Añade un artículo para empezar.'}</EmptyStateDescription>
          </EmptyStateHeader>
        </EmptyState>
      )}
      <ListPagination controller={pagination} singular="artículo" plural="artículos" />
      </>}
      {editing ? (
        <CatalogProductDialog
          key={editing === 'new' ? 'new' : editing.id}
          product={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(undefined)}
        />
      ) : null}
    </PageStack>
  )
}
