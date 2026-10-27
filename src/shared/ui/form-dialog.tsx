import {
  Button,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  SubmitButton,
} from '@doscientos/ui'
import type { FormEventHandler, ReactNode } from 'react'

const sizes = { md: 'max-w-[32rem]', lg: 'max-w-[42rem]' } as const

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  children: ReactNode
  onSubmit: FormEventHandler<HTMLFormElement>
  submitLabel?: string
  loading?: boolean
  submitDisabled?: boolean
  size?: keyof typeof sizes
}

/**
 * Controlled create/edit dialog built from the published @doscientos/ui dialog primitives.
 * Same props as the `FormDialog` of newer @doscientos/ui releases: switch the import once available.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = 'Guardar',
  loading = false,
  submitDisabled = false,
  size = 'md',
}: FormDialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={(next) => (!loading || next) && onOpenChange(next)}>
      <DialogContent className={sizes[size]} showCloseButton={!loading}>
        <form
          className="grid gap-5"
          aria-busy={loading || undefined}
          onSubmit={(event) => {
            event.preventDefault()
            if (!loading && !submitDisabled) onSubmit(event)
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <div className="grid max-h-[60vh] gap-4 overflow-y-auto p-1">{children}</div>
          <DialogFooter>
            <Button variant="outline" isDisabled={loading} onPress={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <SubmitButton loading={loading} isDisabled={submitDisabled}>
              {submitLabel}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
