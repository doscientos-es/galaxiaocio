import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  toast,
} from '@doscientos/ui'
import { ClipboardCheck, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { useCatalog } from '@/features/catalog'

import type { Order } from '../application/order'
import { isEditable } from '../application/order-workflow'
import { useOrders } from '../application/use-orders'
import { validateOrder } from '../application/validation'
import { OrderDataForm, type OrderFormValue } from './order-data-form'
import { WhatsappPhotoCard } from './whatsapp-photo-card'

const toFormValue = ({ customer, address, lines }: Order): OrderFormValue => ({
  customer,
  address,
  lines,
})

/**
 * Validation step: edit the data, then register the order. A WhatsApp photo cannot be
 * registered until a person confirms they have compared it with the form.
 */
export function OrderDataPanel({ order }: { order: Order }) {
  const { products } = useCatalog()
  const { knownSkus, saveData, confirmReview } = useOrders()
  const [value, setValue] = useState(() => toFormValue(order))
  const [reviewed, setReviewed] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)

  const needsReview = order.stage === 'review'
  const editable = isEditable(order)
  const issues = validateOrder(value, knownSkus)
  const visibleIssues = attempted || order.stage === 'incomplete' ? issues : []

  async function submit() {
    setAttempted(true)
    setSaving(true)
    try {
      const saved = needsReview ? await confirmReview(order, value) : await saveData(order, value)
      if (saved.stage === 'stored') {
        toast.success('Pedido registrado', { description: 'Cliente guardado en la base de datos.' })
      } else {
        toast.warning('Faltan datos', {
          description: 'Resuélvelos con el equipo y vuelve a validar.',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <Card>
        <CardHeader>
          <CardTitle>Datos del pedido</CardTitle>
          <CardDescription>
            {editable
              ? 'Comprobamos que el cliente, la dirección y los artículos estén identificados.'
              : 'El pedido ya está en marcha: los datos quedan bloqueados.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {visibleIssues.length > 0 ? (
            <Alert variant="warning">
              <ShieldCheck aria-hidden />
              <AlertTitle>Faltan datos para continuar</AlertTitle>
              <AlertDescription>
                Corrige los campos marcados y vuelve a validar; el pedido no avanza hasta entonces.
              </AlertDescription>
            </Alert>
          ) : null}
          <OrderDataForm
            value={value}
            issues={visibleIssues}
            products={products}
            disabled={!editable || saving}
            onChange={setValue}
          />
        </CardContent>
        {editable ? (
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            {needsReview ? (
              <Checkbox isSelected={reviewed} onChange={setReviewed}>
                He comparado los datos con la foto
              </Checkbox>
            ) : (
              <span />
            )}
            <Button isDisabled={saving || (needsReview && !reviewed)} onPress={() => void submit()}>
              <ClipboardCheck aria-hidden />
              {needsReview ? 'Confirmar revisión y registrar' : 'Guardar y validar'}
            </Button>
          </CardFooter>
        ) : null}
      </Card>
      {order.whatsappPhoto ? (
        <WhatsappPhotoCard transcript={order.whatsappPhoto.transcript} />
      ) : null}
    </div>
  )
}
