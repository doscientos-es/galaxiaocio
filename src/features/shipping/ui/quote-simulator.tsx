import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldLabel,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableNumber,
  TableRow,
} from '@doscientos/ui'
import { useState } from 'react'

import { formatCents } from '@/shared/lib/format'
import { SimpleSelect } from '@/shared/ui/simple-select'

import { serviceLabels, zoneLabels, type Zone } from '../application/carrier'
import { packagesFor } from '../application/quote'
import { useShipping } from '../application/use-shipping'

const zoneOptions = (Object.keys(zoneLabels) as Zone[]).map((id) => ({
  id,
  label: zoneLabels[id],
}))

/** Lets the team check what their formulas charge before a real order depends on them. */
export function QuoteSimulator() {
  const { quoteZone } = useShipping()
  const [zone, setZone] = useState<Zone>('es-peninsula')
  const [weight, setWeight] = useState('25')

  const kg = Number(weight.replace(',', '.'))
  const result = Number.isFinite(kg) && kg > 0 ? quoteZone(zone, kg) : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Probar precios</CardTitle>
        <CardDescription>
          Elige un destino y un peso: verás qué agencia se recomendaría con las fórmulas actuales.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Destino</FieldLabel>
            <SimpleSelect label="Destino" value={zone} options={zoneOptions} onChange={setZone} />
          </Field>
          <Field>
            <FieldLabel htmlFor="simulator-weight">Peso del envío (kg)</FieldLabel>
            <Input
              id="simulator-weight"
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </Field>
        </div>
        {!result ? (
          <p className="text-muted-foreground text-sm">Indica un peso mayor que 0.</p>
        ) : result.options.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Ninguna tarifa cubre {kg} kg a este destino ({serviceLabels[result.service]}). En un
            pedido real habría que elegir la agencia a mano.
          </p>
        ) : (
          <Table density="compact">
            <TableHeader>
              <TableRow>
                <TableHead>
                  Agencia · {serviceLabels[result.service]} · {packagesFor(kg, result.service)}{' '}
                  bulto(s)
                </TableHead>
                <TableHead className="text-right">Precio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.options.map((option) => (
                <TableRow key={option.tariff.id}>
                  <TableCell>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{option.carrier.name}</span>
                      {option.tariff.id === result.recommended?.tariff.id ? (
                        <Badge variant="success">Recomendada</Badge>
                      ) : null}
                      {!option.carrier.hasAccount ? (
                        <Badge variant="warning">Sin cuenta</Badge>
                      ) : null}
                    </span>
                    <code className="text-muted-foreground text-xs">{option.tariff.formula}</code>
                  </TableCell>
                  <TableCell>
                    <TableNumber>{formatCents(option.priceCents)}</TableNumber>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
