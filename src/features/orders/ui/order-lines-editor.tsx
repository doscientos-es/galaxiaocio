import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  IconButton,
  Input,
  QuantityInput,
  Select,
  SelectContent,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
} from '@doscientos/ui'
import { Plus, Trash2 } from 'lucide-react'

import type { Product } from '@/features/catalog'
import { createId } from '@/shared/lib/ids'

import type { OrderLine } from '../application/order'
import type { OrderIssue } from '../application/validation'

interface OrderLinesEditorProps {
  lines: OrderLine[]
  products: Product[]
  issues: OrderIssue[]
  disabled: boolean
  onChange: (lines: OrderLine[]) => void
}

export function OrderLinesEditor({
  lines,
  products,
  issues,
  disabled,
  onChange,
}: OrderLinesEditorProps) {
  const patch = (id: string, change: Partial<OrderLine>) =>
    onChange(lines.map((line) => (line.id === id ? { ...line, ...change } : line)))

  return (
    <div className="grid min-w-0 gap-3">
      {lines.map((line) => {
        const issue = issues.find((candidate) => candidate.field === `line:${line.id}`)
        return (
          <div key={line.id} className="grid min-w-0 gap-1.5">
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div className="col-span-2 grid min-w-0 gap-1.5 sm:col-span-1">
                <span className="text-sm font-medium">Artículo</span>
                <Select
                  aria-label="Artículo"
                  className="min-w-0 flex-1"
                  placeholder="Elegir artículo del catálogo"
                  isDisabled={disabled}
                  isInvalid={issue !== undefined}
                  selectedKey={line.sku || null}
                  onSelectionChange={(key) => {
                    const product = products.find((candidate) => candidate.sku === String(key))
                    if (product)
                      patch(line.id, { sku: product.sku, description: line.description || product.name })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectList items={products}>
                      {(product) => (
                        <SelectItem id={product.sku} textValue={product.name}>
                          {product.name}
                        </SelectItem>
                      )}
                    </SelectList>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <span className="text-sm font-medium">Cantidad</span>
                <QuantityInput
                  aria-label="Cantidad"
                  value={line.quantity}
                  isDisabled={disabled}
                  onChange={(quantity) =>
                    patch(line.id, { quantity: Number.isNaN(quantity) ? 0 : quantity })
                  }
                />
              </div>
              <IconButton
                label="Quitar artículo"
                variant="ghost"
                isDisabled={disabled}
                onPress={() => onChange(lines.filter((candidate) => candidate.id !== line.id))}
              >
                <Trash2 aria-hidden />
              </IconButton>
            </div>
            <div className="grid min-w-0 gap-3 pt-2 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor={`${line.id}-description`}>Descripción original</FieldLabel>
                <Input
                  id={`${line.id}-description`}
                  placeholder="Descripción tal como aparece en el pedido"
                  value={line.description}
                  disabled={disabled}
                  onChange={(event) => patch(line.id, { description: event.target.value })}
                />
              </Field>
              {([
                ['originalSku', 'SKU original', 'Ej. Q0-QM5K-G2HR'],
                ['originalAsin', 'ASIN', 'Ej. B0G3XL3XR3'],
                ['originalReference', 'Referencia del artículo', 'Nº de pedido del artículo'],
                ['originalPrice', 'Precio unitario original (€)', 'Ej. 220,00'],
                ['originalTotal', 'Total original del artículo (€)', 'Ej. 220,00'],
                ['originalState', 'Estado del artículo', 'Ej. Nuevo'],
              ] as const).map(([key, label, placeholder]) => (
                <Field key={key}>
                  <FieldLabel htmlFor={`${line.id}-${key}`}>{label}</FieldLabel>
                  <Input
                    id={`${line.id}-${key}`}
                    placeholder={placeholder}
                    value={line[key] ?? ''}
                    disabled={disabled}
                    onChange={(event) => patch(line.id, { [key]: event.target.value })}
                  />
                </Field>
              ))}
            </div>
            <FieldDescription className="text-xs">
              El precio original es informativo. Selecciona el artículo del catálogo para gestionar el stock.
            </FieldDescription>
            {issue ? <FieldError>{issue.message}</FieldError> : null}
          </div>
        )
      })}
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        isDisabled={disabled}
        onPress={() =>
          onChange([...lines, { id: createId('line'), sku: '', description: '', quantity: 1 }])
        }
      >
        <Plus aria-hidden />
        Añadir artículo
      </Button>
    </div>
  )
}
