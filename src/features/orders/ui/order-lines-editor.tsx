import {
  Button,
  FieldError,
  IconButton,
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
    <div className="grid gap-3">
      {lines.map((line) => {
        const issue = issues.find((candidate) => candidate.field === `line:${line.id}`)
        return (
          <div key={line.id} className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <Select
                aria-label="Artículo"
                className="min-w-0 flex-1"
                placeholder="Elegir artículo del catálogo"
                isDisabled={disabled}
                isInvalid={issue !== undefined}
                selectedKey={line.sku || null}
                onSelectionChange={(key) => {
                  const product = products.find((candidate) => candidate.sku === String(key))
                  if (product) patch(line.id, { sku: product.sku, description: product.name })
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
              <QuantityInput
                aria-label="Cantidad"
                value={line.quantity}
                isDisabled={disabled}
                onChange={(quantity) =>
                  patch(line.id, { quantity: Number.isNaN(quantity) ? 0 : quantity })
                }
              />
              <IconButton
                label="Quitar artículo"
                variant="ghost"
                isDisabled={disabled}
                onPress={() => onChange(lines.filter((candidate) => candidate.id !== line.id))}
              >
                <Trash2 aria-hidden />
              </IconButton>
            </div>
            {line.sku === '' && line.description ? (
              <p className="text-muted-foreground text-xs">Según el pedido: «{line.description}»</p>
            ) : null}
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
