import { toast } from '@doscientos/ui'
import { useState } from 'react'

import { useCatalog } from '@/features/catalog'
import { createId } from '@/shared/lib/ids'
import { FormDialog } from '@/shared/ui/form-dialog'

import type { Order } from '../application/order'
import { useOrders } from '../application/use-orders'
import { validateOrder } from '../application/validation'
import { OrderDataForm, type OrderFormValue } from './order-data-form'

const emptyValue = (): OrderFormValue => ({
  customer: { name: '', taxId: '', email: '', phone: '' },
  address: { street: '', postalCode: '', city: '', country: 'ES' },
  lines: [{ id: createId('line'), sku: '', description: '', quantity: 1 }],
})

interface NewOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (order: Order) => void
}

/** Manual order form: the same fields and validation as every other channel. */
export function NewOrderDialog({ open, onOpenChange, onCreated }: NewOrderDialogProps) {
  const { products } = useCatalog()
  const { receive, knownSkus } = useOrders()
  const [value, setValue] = useState(emptyValue)
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)

  const issues = attempted ? validateOrder(value, knownSkus) : []

  async function submit() {
    setAttempted(true)
    setSaving(true)
    try {
      const order = await receive({
        ...value,
        channel: 'manual',
        marketplace: null,
        whatsappPhoto: null,
        notes: '',
      })
      toast.success('Pedido creado', { description: order.reference })
      setValue(emptyValue())
      setAttempted(false)
      onOpenChange(false)
      onCreated(order)
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nuevo pedido manual"
      description="Introduce el pedido tal y como lo has recibido. Si falta algún dato, quedará marcado."
      submitLabel="Registrar pedido"
      size="lg"
      loading={saving}
      onSubmit={() => void submit()}
    >
      <OrderDataForm value={value} issues={issues} products={products} onChange={setValue} />
    </FormDialog>
  )
}
