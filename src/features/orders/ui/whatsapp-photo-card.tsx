import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@doscientos/ui'
import { Camera } from 'lucide-react'

/** Shows the photo received by WhatsApp so the data can be checked against the original. */
export function WhatsappPhotoCard({ transcript }: { transcript: string[] }) {
  return (
    <Card variant="subtle">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera aria-hidden className="size-4" />
          Foto recibida por WhatsApp
        </CardTitle>
        <CardDescription>
          Compara estos datos con el formulario antes de registrar el pedido.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <figure
          aria-label="Contenido de la foto del pedido"
          className="bg-card border-border rotate-[-0.6deg] rounded-xl border border-dashed p-4 shadow-sm"
        >
          {transcript.map((text) => (
            <p key={text} className="font-mono text-sm leading-7">
              {text}
            </p>
          ))}
        </figure>
        <Badge variant="neutral" className="w-fit">
          Lectura automática simulada · puede contener errores
        </Badge>
      </CardContent>
    </Card>
  )
}
