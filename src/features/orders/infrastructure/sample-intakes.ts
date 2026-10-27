import { createId } from '@/shared/lib/ids'

import type { IntakeDraft, OrderChannel } from '../application/order'
import type { IncomingOrderSource } from '../application/orders-repository'

type SampleLine = [sku: string, description: string, quantity: number]

const draft = (
  channel: OrderChannel,
  customer: [name: string, taxId: string, email: string, phone: string],
  address: [street: string, postalCode: string, city: string],
  lines: SampleLine[],
  extra: Partial<IntakeDraft> = {},
): IntakeDraft => ({
  channel,
  marketplace: null,
  customer: { name: customer[0], taxId: customer[1], email: customer[2], phone: customer[3] },
  address: { street: address[0], postalCode: address[1], city: address[2], country: 'ES' },
  lines: lines.map(([sku, description, quantity]) => ({
    id: createId('line'),
    sku,
    description,
    quantity,
  })),
  whatsappPhoto: null,
  notes: '',
  ...extra,
})

const pools: Record<OrderChannel, Array<() => IntakeDraft>> = {
  web: [
    () =>
      draft(
        'web',
        ['Restaurante La Barca', 'B24681357', 'pedidos@labarca.example', '655443322'],
        ['Passeig Marítim 31', '07014', 'Palma'],
        [
          ['FOG-4F', 'Fogón a gas 4 fuegos', 1],
          ['MES-180', 'Mesa de trabajo acero inox 180 cm', 2],
        ],
      ),
    () =>
      draft(
        'web',
        ['Bar Casa Pepe', 'B13579246', 'pepe@casapepe.example', '911223344'],
        ['C/ Toledo 77', '28005', 'Madrid'],
        [
          ['CMP-120', 'Campana extractora inox 120 cm', 1],
          ['FRY-2X8', 'Freidora eléctrica doble 2 × 8 L', 1],
        ],
      ),
  ],
  email: [
    () =>
      draft(
        'email',
        ['Hotel Mirador', 'B30303030', 'compras@hotelmirador.example', ''],
        ['Camino Real 5', '', 'Sitges'],
        [
          ['LAV-500', 'Lavavajillas de capota 500 × 500', 1],
          ['', 'Carro de servicio inox', 2],
        ],
      ),
    () =>
      draft(
        'email',
        ['Catering Sabor', 'B40404040', 'logistica@catering-sabor.example', '934001122'],
        ['Polígono Can Calderón, nave 4', '08830', 'Sant Boi de Llobregat'],
        [
          ['BAT-020', 'Batidora amasadora 20 L', 2],
          ['GN-11X6', 'Cubeta GN 1/1 inox (pack 6)', 10],
        ],
      ),
  ],
  whatsapp: [
    () =>
      draft(
        'whatsapp',
        ['Leroy Merlin Sant Boi', '', '', ''],
        ['Av. de la Ciutat 12', '08830', 'Sant Boi de Llobregat'],
        [
          ['COR-300', 'Cortafiambres profesional 300 mm', 1],
          ['', 'Carro inox 3 baldas', 1],
        ],
        {
          marketplace: 'leroy-merlin',
          whatsappPhoto: {
            transcript: [
              'LEROY MERLIN · Pedido LM-99120',
              'Entrega: tienda Sant Boi',
              'Av. de la Ciutat 12 – 08830',
              '1 x Cortafiambres prof. 300',
              '1 x Carro inox 3 baldas',
              'Contacto: (sin indicar)',
            ],
          },
        },
      ),
  ],
  manual: [() => draft('manual', ['', '', '', ''], ['', '', ''], [])],
}

/** Simulates each channel delivering a different order every time it is polled. */
export function createSampleIncomingSource(): IncomingOrderSource {
  const counters: Record<OrderChannel, number> = { web: 0, email: 0, manual: 0, whatsapp: 0 }
  return {
    fetch: (channel) => {
      const pool = pools[channel]
      const factory = pool[counters[channel] % pool.length] ?? pool[0]
      counters[channel] += 1
      return Promise.resolve(
        (factory ?? (() => draft(channel, ['', '', '', ''], ['', '', ''], [])))(),
      )
    },
  }
}
