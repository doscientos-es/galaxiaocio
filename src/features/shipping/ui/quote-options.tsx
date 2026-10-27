import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableNumber,
  TableRow,
} from '@doscientos/ui'

import { formatCents } from '@/shared/lib/format'

import type { QuoteResult } from '../application/quote'

interface QuoteOptionsProps {
  result: QuoteResult
  selectedId: string | undefined
  onSelect: (tariffId: string) => void
}

/** Lists every carrier that can take the shipment, cheapest first. */
export function QuoteOptions({ result, selectedId, onSelect }: QuoteOptionsProps) {
  return (
    <Table density="compact">
      <TableHeader>
        <TableRow>
          <TableHead>Agencia</TableHead>
          <TableHead className="text-right">Precio</TableHead>
          <TableHead className="w-0" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {result.options.map((option) => {
          const selected = option.tariff.id === selectedId
          const recommended = option.tariff.id === result.recommended?.tariff.id
          return (
            <TableRow key={option.tariff.id} data-state={selected ? 'selected' : undefined}>
              <TableCell>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{option.carrier.name}</span>
                  {recommended ? <Badge variant="success">Recomendada</Badge> : null}
                  {!option.carrier.hasAccount ? <Badge variant="warning">Sin cuenta</Badge> : null}
                </span>
                <code className="text-muted-foreground block text-xs">{option.tariff.formula}</code>
              </TableCell>
              <TableCell>
                <TableNumber>{formatCents(option.priceCents)}</TableNumber>
              </TableCell>
              <TableCell>
                {selected ? (
                  <Badge>Elegida</Badge>
                ) : (
                  <Button variant="outline" size="sm" onPress={() => onSelect(option.tariff.id)}>
                    Elegir
                  </Button>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
