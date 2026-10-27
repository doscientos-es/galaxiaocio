import { cn } from '@doscientos/ui'
import { Check } from 'lucide-react'

import type { OrderStage } from '../application/order'

const steps = [
  { id: 'entry', label: 'Entrada' },
  { id: 'validation', label: 'Validación' },
  { id: 'stock', label: 'Stock y compras' },
  { id: 'transport', label: 'Transporte' },
  { id: 'admin', label: 'Administración' },
] as const

/** Index of the step a stage is working on (steps before it are done). */
const currentStep: Record<OrderStage, number> = {
  review: 0,
  incomplete: 1,
  stored: 2,
  ready: 3,
  shipped: 4,
  closed: 5,
}

/** Horizontal summary of the agreed flow: entry → validation → stock → transport → admin. */
export function OrderProgress({ stage }: { stage: OrderStage }) {
  const current = currentStep[stage]
  return (
    <ol aria-label="Progreso del pedido" className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current
        return (
          <li
            key={step.id}
            className="flex items-center gap-2"
            aria-current={active ? 'step' : undefined}
          >
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                done && 'bg-success text-primary-foreground',
                active && 'bg-primary text-primary-foreground',
                !done && !active && 'bg-muted text-muted-foreground',
              )}
            >
              {done ? <Check aria-hidden className="size-3.5" /> : index + 1}
            </span>
            <span className={cn('text-sm', active ? 'font-semibold' : 'text-muted-foreground')}>
              {step.label}
            </span>
            {index < steps.length - 1 ? (
              <span aria-hidden className="bg-border mx-1 h-px w-6" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
