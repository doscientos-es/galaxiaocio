import { Field, FieldDescription, FieldLabel, QuantityInput, toast } from '@doscientos/ui'
import { useState } from 'react'

import { FormDialog } from '@/shared/ui/form-dialog'

import type { Product } from '../application/product'

interface RestockDialogProps {
  product: Product | undefined
  onClose: () => void
  onSave: (sku: string, quantity: number) => Promise<unknown>
}

export function RestockDialog({ product, onClose, onSave }: RestockDialogProps) {
  const [quantity, setQuantity] = useState(0)
  const [saving, setSaving] = useState(false)
  const validQuantity = Number.isInteger(quantity) && quantity >= 1

  async function submit() {
    if (!product || !validQuantity) return
    setSaving(true)
    try {
      await onSave(product.sku, quantity)
      toast.success('Recepción registrada', { description: `${product.name}: +${quantity} uds.` })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      open={product !== undefined}
      onOpenChange={(open) => !open && onClose()}
      title="Registrar recepción"
      description={product ? `${product.sku} · ${product.name}` : undefined}
      submitLabel="Registrar recepción"
      loading={saving}
      submitDisabled={!validQuantity}
      onSubmit={() => void submit()}
    >
      <Field>
        <FieldLabel htmlFor="restock-quantity">Unidades recibidas</FieldLabel>
        <QuantityInput
          aria-label="Unidades recibidas"
          id="restock-quantity"
          value={quantity}
          minValue={1}
          onChange={setQuantity}
        />
        <FieldDescription>Registra únicamente unidades que ya hayan llegado.</FieldDescription>
      </Field>
    </FormDialog>
  )
}
