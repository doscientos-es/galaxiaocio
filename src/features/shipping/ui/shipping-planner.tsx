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
  Select,
  SelectContent,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
  Separator,
  toast,
} from '@doscientos/ui'
import { useState } from 'react'

import { useCatalog } from '@/features/catalog'
import type { Order } from '@/features/orders'
import { formatKg } from '@/shared/lib/format'

import { serviceLabels, zoneLabels, type Shipment } from '../application/carrier'
import { packagesFor } from '../application/quote'
import { buildShipment, totalWeightKg, type ShipmentChoice } from '../application/shipment'
import { useShipping } from '../application/use-shipping'
import { CarrierHandoff } from './carrier-handoff'
import { QuoteOptions } from './quote-options'

interface ShippingPlannerProps {
  order: Order
  onShipped: (shipment: Shipment) => Promise<void>
}

const euros = (cents: number): string => (cents / 100).toFixed(2).replace('.', ',')

/** Transport step: calculate options, pick one (or go manual) and hand off to the carrier. */
export function ShippingPlanner({ order, onShipped }: ShippingPlannerProps) {
  const { carriers, quote, saveShipment } = useShipping()
  const { products } = useCatalog()
  const [selectedId, setSelectedId] = useState<string>()
  const [manual, setManual] = useState(false)
  const [manualCarrierId, setManualCarrierId] = useState<string>()
  const [tracking, setTracking] = useState('')
  const [costInput, setCostInput] = useState<string>()
  const [saving, setSaving] = useState(false)

  const weightKg = totalWeightKg(order.lines, products)
  const result = quote(order.address, weightKg)
  const noOptions = result.options.length === 0
  const manualMode = manual || noOptions
  const chosen =
    result.options.find((option) => option.tariff.id === selectedId) ?? result.recommended
  const carrier = manualMode
    ? carriers.find((item) => item.id === manualCarrierId)
    : chosen?.carrier
  const saved = chosen && result.reference ? result.reference.priceCents - chosen.priceCents : 0
  const cheapest = result.options[0]
  const unavailableCheaper =
    cheapest &&
    result.recommended &&
    !cheapest.carrier.hasAccount &&
    cheapest.priceCents < result.recommended.priceCents
      ? { carrier: cheapest.carrier, diff: result.recommended.priceCents - cheapest.priceCents }
      : undefined
  const defaultCost = manualMode || !chosen ? '' : euros(chosen.priceCents)
  const cost = costInput ?? defaultCost

  async function confirm() {
    const choice: ShipmentChoice | undefined =
      !manualMode && chosen
        ? { kind: 'quoted', option: chosen }
        : carrier && { kind: 'manual', carrier }
    if (!choice) return
    setSaving(true)
    try {
      const shipment = buildShipment({
        orderId: order.id,
        quote: result,
        choice,
        costCents: Math.round(Number(cost.replace(',', '.')) * 100),
        trackingNumber: tracking,
        now: new Date(),
      })
      await saveShipment(shipment)
      await onShipped(shipment)
      toast.success('Pedido marcado como enviado', {
        description: `${shipment.carrierName} · coste guardado`,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transporte</CardTitle>
        <CardDescription>
          Calculamos las opciones según destino, peso y tarifas. Prioridad a agencias con cuenta.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="neutral">
            {result.zone ? zoneLabels[result.zone] : 'Destino sin tarifa'}
          </Badge>
          <Badge variant="neutral">{serviceLabels[result.service]}</Badge>
          <Badge variant="neutral">
            {formatKg(weightKg)} · {packagesFor(weightKg, result.service)} bulto(s)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        {manualMode ? (
          <div className="grid gap-3">
            <Alert variant="info">
              <AlertTitle>
                {noOptions ? 'No hay una opción adecuada' : 'Revisión manual'}
              </AlertTitle>
              <AlertDescription>
                Revisa las tarifas por tu cuenta y elige la agencia. Podrás guardar el coste
                igualmente.
              </AlertDescription>
            </Alert>
            <Select
              aria-label="Agencia"
              placeholder="Elegir agencia"
              selectedKey={manualCarrierId ?? null}
              onSelectionChange={(key) => setManualCarrierId(String(key))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectList items={carriers}>
                  {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
                </SelectList>
              </SelectContent>
            </Select>
            {!noOptions ? (
              <Button
                variant="link"
                className="w-fit px-0"
                onPress={() => {
                  setManual(false)
                  setCostInput(undefined)
                }}
              >
                Volver a las opciones calculadas
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3">
            {unavailableCheaper ? (
              <Alert variant="info">
                <AlertTitle>{unavailableCheaper.carrier.name} sería más barata</AlertTitle>
                <AlertDescription>
                  Ahorrarías {euros(unavailableCheaper.diff)} €, pero todavía no tenéis cuenta con
                  esa agencia. Recomendamos la más barata de las que sí tenéis.
                </AlertDescription>
              </Alert>
            ) : null}
            <QuoteOptions
              result={result}
              selectedId={chosen?.tariff.id}
              onSelect={(id) => {
                setSelectedId(id)
                setCostInput(undefined)
              }}
            />
            {saved > 0 ? (
              <Badge variant="success" className="w-fit">
                Ahorras {euros(saved)} € frente a la opción más cara
              </Badge>
            ) : null}
            <Button
              variant="link"
              className="w-fit px-0"
              onPress={() => {
                setManual(true)
                setCostInput(undefined)
              }}
            >
              Es un caso especial: elegir otra agencia manualmente
            </Button>
          </div>
        )}
        {carrier ? (
          <>
            <Separator />
            <CarrierHandoff
              key={carrier.id}
              order={order}
              carrier={carrier}
              weightKg={weightKg}
              packages={packagesFor(weightKg, result.service)}
              trackingNumber={tracking}
              costInput={cost}
              saving={saving}
              onTrackingChange={setTracking}
              onCostChange={setCostInput}
              onConfirm={() => void confirm()}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
