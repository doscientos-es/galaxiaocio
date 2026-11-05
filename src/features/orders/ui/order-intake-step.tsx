import { Button, Field, FieldLabel, Input, Textarea } from '@doscientos/ui'
import { ArrowLeft, Camera, ClipboardList, FileText } from 'lucide-react'

export type IntakeStep = 'choose' | 'photo' | 'text' | 'review'

export function OrderIntakeStep({
  step,
  text,
  file,
  onStepChange,
  onTextChange,
  onFileChange,
}: {
  step: Exclude<IntakeStep, 'review'>
  text: string
  file: File | null
  onStepChange: (step: IntakeStep) => void
  onTextChange: (text: string) => void
  onFileChange: (file: File | null) => void
}) {
  if (step === 'choose') {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {([
          { step: 'photo', icon: Camera, title: 'Desde una foto', detail: 'Sube una imagen del pedido.' },
          { step: 'text', icon: FileText, title: 'Desde un texto', detail: 'Pega el contenido recibido.' },
          { step: 'review', icon: ClipboardList, title: 'Formulario manual', detail: 'Introduce los datos a mano.' },
        ] as const).map(({ step: next, icon: Icon, title, detail }) => (
          <Button
            key={next}
            variant="outline"
            className="h-auto min-h-32 flex-col items-start justify-start gap-2 whitespace-normal p-4 text-left"
            onPress={() => onStepChange(next)}
          >
            <Icon aria-hidden className="text-muted-foreground size-5" />
            <span className="font-semibold">{title}</span>
            <span className="text-muted-foreground text-xs font-normal">{detail}</span>
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <Button variant="ghost" size="sm" className="w-fit" onPress={() => onStepChange('choose')}>
        <ArrowLeft aria-hidden /> Cambiar origen
      </Button>
      {step === 'photo' ? (
        <>
          <Field>
            <FieldLabel htmlFor="order-photo">Foto del pedido</FieldLabel>
            <Input
              id="order-photo"
              type="file"
              accept="image/*"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
            {file ? <span className="text-muted-foreground text-sm">{file.name}</span> : null}
          </Field>
        </>
      ) : (
        <>
          <Field>
            <FieldLabel htmlFor="order-text">Texto del pedido</FieldLabel>
            <Textarea
              id="order-text"
              className="min-h-48"
              placeholder={'Pega aquí el pedido. Por ejemplo:\nCliente: Nombre\nDirección: Calle y número\nProducto: Descripción'}
              value={text}
              onChange={(event) => onTextChange(event.target.value)}
            />
          </Field>
        </>
      )}
    </div>
  )
}