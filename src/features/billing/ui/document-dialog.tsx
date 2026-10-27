import {
  Button,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableNumber,
  TableRow,
} from '@doscientos/ui'

import { formatCents, formatDate } from '@/shared/lib/format'

import { documentKindLabels, type BillingDocument } from '../application/document'

interface DocumentDialogProps {
  document: BillingDocument | undefined
  onClose: () => void
}

export function DocumentDialog({ document, onClose }: DocumentDialogProps) {
  return (
    <DialogRoot open={document !== undefined} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[42rem]">
        {document ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {documentKindLabels[document.kind]} {document.number}
              </DialogTitle>
              <DialogDescription>
                {document.customerName} · {document.customerTaxId || 'Sin NIF'} ·{' '}
                {formatDate(document.issuedAt)}
              </DialogDescription>
            </DialogHeader>
            <Table density="compact">
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {document.lines.map((line) => (
                  <TableRow key={line.description}>
                    <TableCell>{line.description}</TableCell>
                    <TableCell>
                      <TableNumber>{line.quantity}</TableNumber>
                    </TableCell>
                    <TableCell>
                      <TableNumber>{formatCents(line.unitCents)}</TableNumber>
                    </TableCell>
                    <TableCell>
                      <TableNumber>{formatCents(line.quantity * line.unitCents)}</TableNumber>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <dl className="grid justify-items-end gap-1 text-sm">
              <div className="flex gap-6">
                <dt className="text-muted-foreground">Base imponible</dt>
                <dd className="w-24 text-right tabular-nums">{formatCents(document.netCents)}</dd>
              </div>
              <div className="flex gap-6">
                <dt className="text-muted-foreground">IVA 21 %</dt>
                <dd className="w-24 text-right tabular-nums">{formatCents(document.vatCents)}</dd>
              </div>
              <div className="flex gap-6 font-semibold">
                <dt>Total</dt>
                <dd className="w-24 text-right tabular-nums">{formatCents(document.totalCents)}</dd>
              </div>
            </dl>
            {document.note ? (
              <p className="text-muted-foreground text-sm">{document.note}</p>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onPress={onClose}>
                Cerrar
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </DialogRoot>
  )
}
