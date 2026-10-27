import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  MetricCard,
  MetricGrid,
  PageHeader,
  PageHeaderActions,
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
  toast,
} from '@doscientos/ui'
import { Download, Euro, FileText, Truck } from 'lucide-react'
import { useState } from 'react'

import { useOrders } from '@/features/orders'
import { useShipping } from '@/features/shipping'
import { downloadTextFile } from '@/shared/lib/csv'
import { formatCents, formatDate } from '@/shared/lib/format'

import { documentKindLabels, type BillingDocument } from '../application/document'
import { buildGestorExport } from '../application/gestor-export'
import { useBilling } from '../application/use-billing'
import { DocumentDialog } from './document-dialog'

export function AdministrationPage() {
  const { documents } = useBilling()
  const { orders } = useOrders()
  const { shipments } = useShipping()
  const [viewing, setViewing] = useState<BillingDocument>()

  const invoices = documents.filter((document) => document.kind === 'invoice')
  const net = invoices.reduce((sum, document) => sum + document.netCents, 0)
  const vat = invoices.reduce((sum, document) => sum + document.vatCents, 0)

  function exportForAccountant() {
    for (const file of buildGestorExport(orders, documents, shipments, new Date())) {
      downloadTextFile(file.fileName, file.content)
    }
    toast.success('Exportación preparada', {
      description: 'Pedidos, albaranes y expediciones (CSV).',
    })
  }

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Administración</PageHeaderTitle>
          <PageHeaderDescription>
            Pedidos, albaranes y expediciones preparados para el gestor.
          </PageHeaderDescription>
        </PageHeaderHeading>
        <PageHeaderActions>
          <Button onPress={exportForAccountant}>
            <Download aria-hidden />
            Exportar para el gestor
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <MetricGrid columns={3}>
        <MetricCard label="Documentos emitidos" value={documents.length} icon={<FileText />} />
        <MetricCard
          label="Facturado (base)"
          value={formatCents(net)}
          description={`IVA repercutido ${formatCents(vat)}`}
          icon={<Euro />}
        />
        <MetricCard label="Expediciones" value={shipments.length} icon={<Truck />} />
      </MetricGrid>
      <Alert variant="info">
        <AlertDescription>
          La exportación usa CSV de ejemplo. El formato final (columnas, periodicidad, IVA diferido)
          se acuerda con el gestor.
        </AlertDescription>
      </Alert>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Pedido</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <span className="mr-2 font-medium">{document.number}</span>
                  <Badge variant={document.kind === 'invoice' ? 'info' : 'neutral'}>
                    {documentKindLabels[document.kind]}
                  </Badge>
                </TableCell>
                <TableCell>{document.customerName}</TableCell>
                <TableCell>{document.orderReference}</TableCell>
                <TableCell>{formatDate(document.issuedAt)}</TableCell>
                <TableCell>
                  <TableNumber>{formatCents(document.totalCents)}</TableNumber>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onPress={() => setViewing(document)}>
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <DocumentDialog document={viewing} onClose={() => setViewing(undefined)} />
    </PageStack>
  )
}
