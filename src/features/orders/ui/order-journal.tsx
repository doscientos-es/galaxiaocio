import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Field, FieldLabel, Textarea, toast } from '@doscientos/ui'
import { useId, useState } from 'react'

import { formatDateTime } from '@/shared/lib/format'

import type { Activity, Order } from '../application/order'
import { useOrders } from '../application/use-orders'

export function OrderJournal({ order, kind }: { order: Order; kind: 'incident' | 'communication' }) {
  const { activity, recordOrderEntry, resolveIncident } = useOrders()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const id = useId()
  const incident = kind === 'incident'
  const entries = activity.filter((entry) => entry.orderId === order.id && entry.kind === kind)
    .sort((a, b) => b.at.localeCompare(a.at))

  async function save() {
    if (!text.trim() || saving) return
    setSaving(true)
    try {
      await recordOrderEntry(order, kind, text)
      setText('')
      toast.success(incident ? 'Incidencia registrada' : 'Comunicación registrada')
    } catch (error) {
      toast.error('No se ha podido guardar', { description: error instanceof Error ? error.message : 'Inténtalo de nuevo.' })
    } finally {
      setSaving(false)
    }
  }

  async function resolve(entry: Activity) {
    setSaving(true)
    try {
      await resolveIncident(order, entry.id)
    } catch (error) {
      toast.error('No se ha podido resolver la incidencia', { description: error instanceof Error ? error.message : 'Inténtalo de nuevo.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{incident ? 'Incidencias' : 'Comunicaciones con el cliente'}</CardTitle>
        <CardDescription>{incident ? 'Registra y resuelve los problemas relacionados con este pedido.' : 'Anota conversaciones manualmente. No se envía ningún mensaje ni se sincronizan los canales.'}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <Field>
          <FieldLabel htmlFor={id}>{incident ? 'Nueva incidencia' : 'Nueva comunicación'}</FieldLabel>
          <Textarea id={id} value={text} maxLength={4000} onChange={(event) => setText(event.target.value)} placeholder={incident ? 'Describe el problema y el contexto' : 'Canal, conversación y próximos pasos'} />
        </Field>
        <Button className="w-fit" isDisabled={!text.trim() || saving} onPress={() => void save()}>{incident ? 'Crear incidencia' : 'Guardar comunicación'}</Button>
        {entries.length === 0 ? <p className="text-muted-foreground text-sm">{incident ? 'No hay incidencias registradas.' : 'No hay comunicaciones registradas.'}</p> : (
          <ul className="divide-border divide-y">
            {entries.map((entry) => (
              <li key={entry.id} className="grid gap-2 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <time className="text-muted-foreground text-xs" dateTime={entry.at}>{formatDateTime(entry.at)}</time>
                  {incident ? <Badge variant={entry.resolvedAt ? 'success' : 'warning'}>{entry.resolvedAt ? 'Resuelta' : 'Abierta'}</Badge> : null}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{entry.detail}</p>
                {incident && !entry.resolvedAt ? <Button className="w-fit" size="sm" variant="outline" isDisabled={saving} onPress={() => void resolve(entry)}>Marcar como resuelta</Button> : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function OrderHistory({ order }: { order: Order }) {
  const { activity } = useOrders()
  const entries = activity.filter((entry) => entry.orderId === order.id).sort((a, b) => b.at.localeCompare(a.at))
  return (
    <Card>
      <CardHeader><CardTitle>Histórico de acciones</CardTitle><CardDescription>Actividad registrada para este pedido.</CardDescription></CardHeader>
      <CardContent>
        {entries.length === 0 ? <p className="text-muted-foreground">No hay actividad registrada.</p> : (
          <ol className="divide-border divide-y">
            {entries.map((entry) => <li key={entry.id} className="grid gap-1 py-3"><div className="flex flex-wrap justify-between gap-2"><strong>{entry.title}</strong><time className="text-muted-foreground text-xs" dateTime={entry.at}>{formatDateTime(entry.at)}</time></div><p className="text-muted-foreground whitespace-pre-wrap break-words">{entry.detail}</p></li>)}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}