import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet, Input } from '@doscientos/ui'
import { FileText } from 'lucide-react'
import { useId } from 'react'

import { SimpleSelect } from '@/shared/ui/simple-select'

import type { Marketplace, Order, OrderSource } from '../application/order'
import { emptyOrderSource } from '../application/order-intake'

const marketplaces: Array<{ id: Marketplace | 'none'; label: string }> = [
  { id: 'none', label: 'Sin plataforma' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'makro', label: 'Makro' },
  { id: 'leroy-merlin', label: 'Leroy Merlin' },
]

const fields = [
  { key: 'reference', label: 'Nº de pedido original', placeholder: 'Ej. 406-1234567-1234567' },
  { key: 'date', label: 'Fecha del pedido', placeholder: 'Ej. 30/09/2026' },
  { key: 'buyer', label: 'Comprador', placeholder: 'Nombre del comprador' },
  { key: 'seller', label: 'Vendedor', placeholder: 'Nombre del vendedor' },
  { key: 'shippingService', label: 'Servicio de envío', placeholder: 'Ej. Estándar' },
  { key: 'total', label: 'Total original (€)', placeholder: 'Ej. 220,00' },
] as const

export function OrderSourceFields({
  source,
  marketplace,
  disabled,
  onChange,
}: {
  source: OrderSource | undefined
  marketplace: Order['marketplace']
  disabled: boolean
  onChange: (patch: Partial<Pick<Order, 'source' | 'marketplace'>>) => void
}) {
  const id = useId()
  const current = source ?? emptyOrderSource()

  return (
    <FieldSet className="min-w-0 gap-3">
      <FieldLegend>
        <span className="inline-flex items-center gap-2">
          <FileText aria-hidden className="text-muted-foreground size-4" />
          Datos del pedido original
        </span>
      </FieldLegend>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Plataforma</FieldLabel>
          <SimpleSelect
            label="Plataforma"
            value={marketplace ?? 'none'}
            options={marketplaces}
            disabled={disabled}
            onChange={(value) => onChange({ marketplace: value === 'none' ? null : value })}
          />
        </Field>
        {fields.map(({ key, label, placeholder }) => (
          <Field key={key}>
            <FieldLabel htmlFor={`${id}-${key}`}>{label}</FieldLabel>
            <Input
              id={`${id}-${key}`}
              placeholder={placeholder}
              value={current[key]}
              disabled={disabled}
              onChange={(event) => onChange({ source: { ...current, [key]: event.target.value } })}
            />
          </Field>
        ))}
      </div>
      <FieldDescription className="text-xs">
        El total original es informativo; los documentos se calculan con los precios del catálogo.
      </FieldDescription>
      {current.originalText ? (
        <details className="text-muted-foreground text-sm">
          <summary className="cursor-pointer">Ver texto original</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words font-sans">{current.originalText}</pre>
        </details>
      ) : null}
    </FieldSet>
  )
}