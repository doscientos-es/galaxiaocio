import { Checkbox, Field, FieldError, FieldLabel, Input, toast } from '@doscientos/ui'
import { useState } from 'react'

import { FormDialog } from '@/shared/ui/form-dialog'

import type { Carrier } from '../application/carrier'
import { toCarrier, validateCarrier, type CarrierDraft } from '../application/tariff-form'

interface CarrierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Agency being edited; omit to create a new one. */
  editing?: Carrier | undefined
  onSave: (carrier: Carrier) => Promise<unknown>
}

export function CarrierDialog({ open, onOpenChange, editing, onSave }: CarrierDialogProps) {
  const [draft, setDraft] = useState<CarrierDraft>(() => ({
    name: editing?.name ?? '',
    portalUrl: editing?.portalUrl ?? 'https://',
    hasAccount: editing?.hasAccount ?? true,
    notes: editing?.notes ?? '',
  }))
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const errors = attempted ? validateCarrier(draft) : {}
  const patch = (change: Partial<CarrierDraft>) => setDraft({ ...draft, ...change })

  async function submit() {
    setAttempted(true)
    if (Object.keys(validateCarrier(draft)).length > 0) return
    setSaving(true)
    try {
      await onSave(toCarrier(draft, editing?.id))
      toast.success(editing ? 'Agencia actualizada' : 'Agencia añadida')
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Editar agencia' : 'Nueva agencia'}
      description="La web es la que se abre al aceptar la agencia recomendada."
      submitLabel={editing ? 'Guardar' : 'Añadir agencia'}
      loading={saving}
      onSubmit={() => void submit()}
    >
      <Field>
        <FieldLabel htmlFor="carrier-name">Nombre</FieldLabel>
        <Input
          id="carrier-name"
          value={draft.name}
          aria-invalid={errors.name ? true : undefined}
          onChange={(event) => patch({ name: event.target.value })}
        />
        {errors.name ? <FieldError>{errors.name}</FieldError> : null}
      </Field>
      <Field>
        <FieldLabel htmlFor="carrier-url">Web para hacer el envío</FieldLabel>
        <Input
          id="carrier-url"
          type="url"
          value={draft.portalUrl}
          aria-invalid={errors.portalUrl ? true : undefined}
          onChange={(event) => patch({ portalUrl: event.target.value })}
        />
        {errors.portalUrl ? <FieldError>{errors.portalUrl}</FieldError> : null}
      </Field>
      <Field>
        <FieldLabel htmlFor="carrier-notes">Notas</FieldLabel>
        <Input
          id="carrier-notes"
          value={draft.notes}
          placeholder="Qué envíos suele cubrir"
          onChange={(event) => patch({ notes: event.target.value })}
        />
      </Field>
      <Checkbox isSelected={draft.hasAccount} onChange={(hasAccount) => patch({ hasAccount })}>
        Tenemos cuenta con esta agencia (se recomienda antes que las demás)
      </Checkbox>
    </FormDialog>
  )
}
