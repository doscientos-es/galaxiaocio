import type { StockStatus, SupplierStatus } from '@/features/catalog'
import type { OrderStage } from '@/features/orders'

export interface NextStep {
  /** Visual weight: `action` needs someone, `waiting` depends on a third party, `done` is finished. */
  tone: 'action' | 'waiting' | 'done'
  title: string
  detail: string
}

interface NextStepInput {
  stage: OrderStage
  stock: StockStatus
  supplierStatus: SupplierStatus
  marketplace: 'makro' | 'amazon' | 'leroy-merlin' | null
}

/** Tells the person what to do with an order right now, following the agreed flow. */
export function nextStep({ stage, stock, supplierStatus, marketplace }: NextStepInput): NextStep {
  switch (stage) {
    case 'review':
      return {
        tone: 'action',
        title: 'Revisa la foto del pedido',
        detail: 'Compara los datos con la foto, complétalos y confirma la revisión.',
      }
    case 'incomplete':
      return {
        tone: 'action',
        title: 'Completa los datos que faltan',
        detail: 'Resuélvelos con el equipo y vuelve a validar para continuar.',
      }
    case 'stored':
      return storedStep(stock, supplierStatus)
    case 'ready':
      return {
        tone: 'action',
        title: 'Acepta la agencia recomendada',
        detail:
          'Se copian los datos del envío y se abre su web. Después guarda el seguimiento y el coste.',
      }
    case 'shipped':
      return {
        tone: 'action',
        title: 'Prepara la información para el gestor',
        detail:
          marketplace === 'makro'
            ? 'El albarán ya está generado. La factura la emite la entidad intermediaria.'
            : 'El albarán y la factura ya están generados. Revísalos y cierra el pedido.',
      }
    case 'closed':
      return {
        tone: 'done',
        title: 'Pedido completado',
        detail: 'Enviado y preparado para el gestor.',
      }
  }
}

function storedStep(stock: StockStatus, supplierStatus: SupplierStatus): NextStep {
  if (stock === 'external') {
    return supplierStatus === 'notified'
      ? {
          tone: 'waiting',
          title: 'Esperando al proveedor',
          detail: 'Cuando llegue el material, márcalo como recibido para continuar.',
        }
      : {
          tone: 'action',
          title: 'Hay que pedir al proveedor',
          detail: 'Avisa al equipo para que haga el pedido del artículo externo.',
        }
  }
  if (stock === 'shortage') {
    return {
      tone: 'waiting',
      title: 'Pedido pendiente por falta de stock',
      detail: 'Repón los artículos que faltan y el pedido podrá continuar.',
    }
  }
  return {
    tone: 'action',
    title: 'Prepara la expedición',
    detail: 'Hay stock suficiente: reserva los artículos y pasa al transporte.',
  }
}
