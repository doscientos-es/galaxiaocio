import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  toast,
} from '@doscientos/ui'
import { FileCheck2, FileText } from 'lucide-react'
import { useState } from 'react'

import type { Order } from '@/features/orders'
import { formatCents } from '@/shared/lib/format'

import { documentKindLabels, type BillingDocument } from '../application/document'
import { useBilling } from '../application/use-billing'
import { DocumentDialog } from './document-dialog'

interface BillingPanelProps {
  order: Order
  /** Called when the documents are ready for the accountant, so the app can close the order. */
  onPrepared: () => Promise<void>
}

/** Administration step: delivery note and invoice, then ready for the accountant. */
export function BillingPanel({ order, onPrepared }: BillingPanelProps) {
  const { documentsFor, issueDocuments } = useBilling()
  const [viewing, setViewing] = useState<BillingDocument>()
  const [saving, setSaving] = useState(false)
  const documents = documentsFor(order.id)
  const isClosed = order.stage === 'closed'

  async function run(action: () => Promise<unknown>, message: string) {
    setSaving(true)
    try {
      await action()
      toast.success(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administración</CardTitle>
        <CardDescription>
          El albarán y la factura se generan solos al marcar el pedido como enviado.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {order.marketplace === 'makro' ? (
          <Alert variant="info">
            <AlertTitle>Pedido de Makro</AlertTitle>
            <AlertDescription>
              Solo se emite albarán: la factura la emite la entidad intermediaria.
            </AlertDescription>
          </Alert>
        ) : null}
        {documents.length === 0 ? (
          <Button
            className="w-fit"
            isDisabled={saving}
            onPress={() => void run(() => issueDocuments(order), 'Documentos generados')}
          >
            <FileText aria-hidden />
            Generar documentos pendientes
          </Button>
        ) : (
          <ul className="grid gap-2">
            {documents.map((document) => (
              <li
                key={document.id}
                className="border-border flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
              >
                <span>
                  <strong>{documentKindLabels[document.kind]}</strong>{' '}
                  <span className="text-muted-foreground">{document.number}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums">{formatCents(document.totalCents)}</span>
                  <Button variant="outline" size="sm" onPress={() => setViewing(document)}>
                    Ver
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
        {documents.length > 0 && !isClosed ? (
          <Button
            className="w-fit"
            isDisabled={saving}
            onPress={() => void run(onPrepared, 'Información preparada para el gestor')}
          >
            <FileCheck2 aria-hidden />
            Preparar para el gestor
          </Button>
        ) : null}
        {isClosed ? <Badge variant="success">Preparado para el gestor</Badge> : null}
      </CardContent>
      <DocumentDialog document={viewing} onClose={() => setViewing(undefined)} />
    </Card>
  )
}
