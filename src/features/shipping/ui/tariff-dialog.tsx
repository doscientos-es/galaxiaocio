import { Field, FieldDescription, FieldError, FieldLabel, Input, toast } from '@doscientos/ui'
import { useState } from 'react'

import { FormDialog } from '@/shared/ui/form-dialog'
import { SimpleSelect } from '@/shared/ui/simple-select'

import {
  serviceLabels,
  zoneLabels,
  type Carrier,
  type ServiceKind,
  type Tariff,
  type Zone,
} from '../application/carrier'
import {
  previewFormula,
  toTariff,
  validateTariff,
  type TariffDraft,
} from '../application/tariff-form'

const options = <Key extends string>(labels: Record<Key, string>) =>
  (Object.keys(labels) as Key[]).map((id) => ({ id, label: labels[id] }))

const serviceOptions = options<ServiceKind>(serviceLabels)
const zoneOptions = options<Zone>(zoneLabels)

const emptyDraft = (carrierId: string): TariffDraft => ({
  carrierId,
  service: 'parcel',
  zone: 'es-peninsula',
  maxWeightKg: '40',
  formula: '5 + 0,2 * ceil(kg)',
})

interface TariffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  carriers: Carrier[]
  tariffs: Tariff[]
  /** Tariff being edited; omit to create a new one. */
  editing?: Tariff | undefined
  /** Agency preselected when creating from its row. */
  defaultCarrierId?: string | undefined
  onSave: (tariff: Tariff) => Promise<unknown>
}

export function TariffDialog({
  open,
  onOpenChange,
  carriers,
  tariffs,
  editing,
  defaultCarrierId,
  onSave,
}: TariffDialogProps) {
  const [draft, setDraft] = useState<TariffDraft>(() =>
    editing
      ? { ...editing, maxWeightKg: String(editing.maxWeightKg) }
      : emptyDraft(defaultCarrierId ?? carriers[0]?.id ?? ''),
  )
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)

  const others = tariffs.filter((tariff) => tariff.id !== editing?.id)
  const errors = attempted ? validateTariff(draft, others) : {}
  const patch = (change: Partial<TariffDraft>) => setDraft({ ...draft, ...change })
  const sample = [10, 50].flatMap((kg) => {
    const price = previewFormula(draft.formula, kg)
    return price ? [`${kg} kg → ${price}`] : []
  })

  async function submit() {
    setAttempted(true)
    if (Object.keys(validateTariff(draft, others)).length > 0) return
    setSaving(true)
    try {
      await onSave(toTariff(draft, editing?.id))
      toast.success(editing ? 'Tarifa actualizada' : 'Tarifa añadida')
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Editar tarifa' : 'Nueva tarifa'}
      description="Una tarifa por agencia, servicio y zona. El precio sale de tu fórmula."
      submitLabel={editing ? 'Guardar' : 'Añadir tarifa'}
      loading={saving}
      onSubmit={() => void submit()}
    >
      <Field>
        <FieldLabel>Agencia</FieldLabel>
        <SimpleSelect
          label="Agencia"
          value={draft.carrierId || undefined}
          options={carriers.map((carrier) => ({ id: carrier.id, label: carrier.name }))}
          onChange={(carrierId) => patch({ carrierId })}
          placeholder="Elegir agencia"
        />
        {errors.carrierId ? <FieldError>{errors.carrierId}</FieldError> : null}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Servicio</FieldLabel>
          <SimpleSelect
            label="Servicio"
            value={draft.service}
            options={serviceOptions}
            onChange={(service) => patch({ service })}
          />
        </Field>
        <Field>
          <FieldLabel>Zona</FieldLabel>
          <SimpleSelect
            label="Zona"
            value={draft.zone}
            options={zoneOptions}
            onChange={(zone) => patch({ zone })}
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="tariff-max">Peso máximo (kg)</FieldLabel>
        <Input
          id="tariff-max"
          inputMode="decimal"
          value={draft.maxWeightKg}
          aria-invalid={errors.maxWeightKg ? true : undefined}
          onChange={(event) => patch({ maxWeightKg: event.target.value })}
        />
        {errors.maxWeightKg ? <FieldError>{errors.maxWeightKg}</FieldError> : null}
      </Field>
      <Field>
        <FieldLabel htmlFor="tariff-formula">Fórmula del precio (€)</FieldLabel>
        <Input
          id="tariff-formula"
          className="font-mono"
          value={draft.formula}
          aria-invalid={errors.formula ? true : undefined}
          onChange={(event) => patch({ formula: event.target.value })}
        />
        <FieldDescription>
          Usa <code>kg</code> y <code>bultos</code>, con + − * / y paréntesis. Funciones:{' '}
          <code>ceil</code>, <code>max(a; b)</code>, <code>min(a; b)</code>. Ejemplo:{' '}
          <code>max(98; 60 + 0,1 * ceil(kg))</code>
        </FieldDescription>
        {errors.formula ? <FieldError>{errors.formula}</FieldError> : null}
        {sample.length > 0 && !errors.formula ? (
          <p className="text-muted-foreground text-sm tabular-nums">
            Ejemplo: {sample.join(' · ')}
          </p>
        ) : null}
      </Field>
    </FormDialog>
  )
}
