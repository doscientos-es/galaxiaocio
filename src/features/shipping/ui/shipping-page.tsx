import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  IconButton,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
  PageStack,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableNumber,
  TableRow,
  toast,
} from '@doscientos/ui'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { formatKg } from '@/shared/lib/format'

import { serviceLabels, zoneLabels, type Carrier, type Tariff } from '../application/carrier'
import { previewFormula } from '../application/tariff-form'
import { useShipping } from '../application/use-shipping'
import { CarrierDialog } from './carrier-dialog'
import { QuoteSimulator } from './quote-simulator'
import { TariffDialog } from './tariff-dialog'

type Removing =
  | { kind: 'carrier'; carrier: Carrier }
  | { kind: 'tariff'; tariff: Tariff; name: string }

function RowActions({
  label,
  onEdit,
  onDelete,
}: {
  label: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <span className="flex justify-end gap-1">
      <IconButton label={`Editar ${label}`} variant="ghost" onPress={onEdit}>
        <Pencil aria-hidden />
      </IconButton>
      <IconButton label={`Eliminar ${label}`} variant="ghost" onPress={onDelete}>
        <Trash2 aria-hidden />
      </IconButton>
    </span>
  )
}

export function ShippingPage() {
  const { carriers, tariffs, saveCarrier, saveTariff, removeCarrier, removeTariff } = useShipping()
  const [carrierDialog, setCarrierDialog] = useState<{ editing: Carrier | undefined }>()
  const [tariffDialog, setTariffDialog] = useState<{ editing: Tariff | undefined }>()
  const [removing, setRemoving] = useState<Removing>()

  async function confirmRemove() {
    if (!removing) return
    if (removing.kind === 'carrier') await removeCarrier(removing.carrier.id)
    else await removeTariff(removing.tariff.id)
    toast.success(removing.kind === 'carrier' ? 'Agencia eliminada' : 'Tarifa eliminada')
    setRemoving(undefined)
  }

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>Agencias y tarifas</PageHeaderTitle>
          <PageHeaderDescription>
            Para cada pedido se recomienda la agencia más barata de las que ya tenéis cuenta. Al
            aceptarla se copian los datos del envío y se abre su web.
          </PageHeaderDescription>
        </PageHeaderHeading>
      </PageHeader>
      <Alert variant="info">
        <AlertTitle>Datos de ejemplo</AlertTitle>
        <AlertDescription>
          Las tarifas y las cuentas de agencia de esta demo son ficticias. Se sustituyen por las
          reales al configurar el sistema.
        </AlertDescription>
      </Alert>
      <QuoteSimulator />
      <Card className="py-0">
        <CardHeader className="pt-(--card-spacing)">
          <CardTitle>Agencias</CardTitle>
          <CardDescription>
            Las que tienen cuenta se recomiendan antes, aunque otra sea algo más barata.
          </CardDescription>
          <CardAction>
            <Button size="sm" onPress={() => setCarrierDialog({ editing: undefined })}>
              <Plus aria-hidden />
              Nueva agencia
            </Button>
          </CardAction>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agencia</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead className="text-right">Tarifas</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {carriers.map((carrier) => (
              <TableRow key={carrier.id}>
                <TableCell>
                  <p className="font-medium">{carrier.name}</p>
                  <p className="text-muted-foreground text-xs">{carrier.notes}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={carrier.hasAccount ? 'success' : 'warning'}>
                    {carrier.hasAccount ? 'Con cuenta' : 'Sin cuenta'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TableNumber>
                    {tariffs.filter((tariff) => tariff.carrierId === carrier.id).length}
                  </TableNumber>
                </TableCell>
                <TableCell>
                  <RowActions
                    label={carrier.name}
                    onEdit={() => setCarrierDialog({ editing: carrier })}
                    onDelete={() => setRemoving({ kind: 'carrier', carrier })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Card className="py-0">
        <CardHeader className="pt-(--card-spacing)">
          <CardTitle>Tarifas y fórmulas</CardTitle>
          <CardDescription>
            El precio de cada envío sale de estas fórmulas. Si una fórmula falla, esa tarifa no se
            usa.
          </CardDescription>
          <CardAction>
            <Button
              size="sm"
              isDisabled={carriers.length === 0}
              onPress={() => setTariffDialog({ editing: undefined })}
            >
              <Plus aria-hidden />
              Nueva tarifa
            </Button>
          </CardAction>
        </CardHeader>
        <Table density="compact">
          <TableHeader>
            <TableRow>
              <TableHead>Tarifa</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead className="text-right">Hasta</TableHead>
              <TableHead>Fórmula (€)</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tariffs.length === 0 ? <TableEmpty colSpan={5}>Aún no hay tarifas.</TableEmpty> : null}
            {tariffs.map((tariff) => {
              const name =
                carriers.find((c) => c.id === tariff.carrierId)?.name ?? 'Agencia borrada'
              return (
                <TableRow key={tariff.id}>
                  <TableCell>
                    {name} · {serviceLabels[tariff.service]}
                  </TableCell>
                  <TableCell>{zoneLabels[tariff.zone]}</TableCell>
                  <TableCell>
                    <TableNumber>{formatKg(tariff.maxWeightKg)}</TableNumber>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{tariff.formula}</code>
                    {!previewFormula(tariff.formula, 10) ? (
                      <Badge variant="danger" className="ml-2">
                        Con error
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      label={`${name} ${zoneLabels[tariff.zone]}`}
                      onEdit={() => setTariffDialog({ editing: tariff })}
                      onDelete={() => setRemoving({ kind: 'tariff', tariff, name })}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
      {carrierDialog ? (
        <CarrierDialog
          open
          editing={carrierDialog.editing}
          onOpenChange={(open) => !open && setCarrierDialog(undefined)}
          onSave={saveCarrier}
        />
      ) : null}
      {tariffDialog ? (
        <TariffDialog
          open
          editing={tariffDialog.editing}
          carriers={carriers}
          tariffs={tariffs}
          onOpenChange={(open) => !open && setTariffDialog(undefined)}
          onSave={saveTariff}
        />
      ) : null}
      <ConfirmDialog
        open={removing !== undefined}
        onOpenChange={(open) => !open && setRemoving(undefined)}
        title={
          removing?.kind === 'carrier' ? `Eliminar ${removing.carrier.name}` : 'Eliminar tarifa'
        }
        description={
          removing?.kind === 'carrier'
            ? 'Se eliminan también todas sus tarifas. Los envíos ya hechos se conservan.'
            : removing
              ? `${removing.name} · ${zoneLabels[removing.tariff.zone]}`
              : undefined
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => void confirmRemove()}
      />
    </PageStack>
  )
}
