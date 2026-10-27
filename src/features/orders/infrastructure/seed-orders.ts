import { formatReference } from '@/shared/lib/ids'

import type { Activity, Customer, Order } from '../application/order'

const hoursAgo = (now: Date, hours: number): string =>
  new Date(now.getTime() - hours * 3_600_000).toISOString()

const line = (n: number, sku: string, description: string, quantity: number) => ({
  id: `line-seed-${n}`,
  sku,
  description,
  quantity,
})

type Seed = Pick<Order, 'customer' | 'address' | 'lines'> &
  Partial<Pick<Order, 'marketplace' | 'whatsappPhoto' | 'notes'>> & {
    channel: Order['channel']
    stage: Order['stage']
    hours: number
  }

const customer = (name: string, taxId: string, email: string, phone: string) => ({
  name,
  taxId,
  email,
  phone,
})

const seeds: Seed[] = [
  {
    channel: 'web',
    stage: 'stored',
    hours: 30,
    customer: customer(
      'Restaurante El Rincón del Mar',
      'B12345678',
      'compras@elrincon.example',
      '612345678',
    ),
    address: { street: 'C/ Mayor 14', postalCode: '28013', city: 'Madrid', country: 'ES' },
    lines: [
      line(1, 'FRY-2X8', 'Freidora eléctrica doble 2 × 8 L', 2),
      line(2, 'CMP-120', 'Campana extractora inox 120 cm', 1),
    ],
  },
  {
    channel: 'email',
    stage: 'incomplete',
    hours: 26,
    customer: customer(
      'Hotel Costa Brava SL',
      'B87654321',
      'cocina@costabrava.example',
      '972000111',
    ),
    address: { street: 'Av. Just Marlès 20', postalCode: '', city: 'Lloret de Mar', country: 'ES' },
    lines: [
      line(3, 'LAV-500', 'Lavavajillas de capota 500 × 500', 1),
      line(4, 'MES-180', 'Mesa de trabajo acero inox 180 cm', 2),
    ],
  },
  {
    channel: 'whatsapp',
    stage: 'review',
    hours: 3,
    marketplace: 'makro',
    customer: customer('Makro Alcobendas', '', '', ''),
    address: {
      street: 'Av. de Bruselas 6',
      postalCode: '28108',
      city: 'Alcobendas',
      country: 'ES',
    },
    lines: [line(5, 'FOG-4F', 'Fogón a gas 4 fuegos', 2), line(6, '', 'Mesa trabajo inox 180', 1)],
    whatsappPhoto: {
      transcript: [
        'MAKRO · Pedido 4500871234',
        'Entrega: Makro Alcobendas',
        'Av. de Bruselas 6 – 28108 Alcobendas',
        '2 x Fogón gas 4 fuegos',
        '1 x Mesa trabajo inox 180',
        'Contacto: (sin indicar)',
      ],
    },
  },
  {
    channel: 'web',
    stage: 'stored',
    hours: 20,
    customer: customer('Bar Hnos. Ferrer', 'B11223344', 'info@hnosferrer.example', '933221100'),
    address: { street: 'C/ del Mar 3', postalCode: '08003', city: 'Barcelona', country: 'ES' },
    lines: [
      line(7, 'VIT-REF', 'Vitrina refrigerada 120 cm', 2),
      line(8, 'BAT-020', 'Batidora amasadora 20 L', 1),
    ],
  },
  {
    channel: 'email',
    stage: 'stored',
    hours: 8,
    customer: customer('Pizzería Da Marco', 'B55667788', 'marco@damarco.example', '960112233'),
    address: {
      street: 'Plaza del Ayuntamiento 9',
      postalCode: '46002',
      city: 'Valencia',
      country: 'ES',
    },
    lines: [
      line(9, 'HRN-FM6', 'Horno de convección FM 6 bandejas', 1),
      line(10, 'COR-300', 'Cortafiambres profesional 300 mm', 1),
    ],
  },
  {
    channel: 'web',
    stage: 'closed',
    hours: 120,
    customer: customer(
      'Cafetería Aurora',
      'B99887766',
      'aurora@cafeteriaaurora.example',
      '944556677',
    ),
    address: { street: 'C/ Ercilla 12', postalCode: '48009', city: 'Bilbao', country: 'ES' },
    lines: [line(11, 'GN-11X6', 'Cubeta GN 1/1 inox (pack 6)', 4)],
  },
]

export function createSeedOrders(now: Date = new Date()): Order[] {
  return seeds.map((seed, index) => ({
    id: `ord-seed-${index + 1}`,
    reference: formatReference('PED', now.getFullYear(), index + 1),
    channel: seed.channel,
    marketplace: seed.marketplace ?? null,
    receivedAt: hoursAgo(now, seed.hours),
    stage: seed.stage,
    customer: seed.customer,
    customerId: seed.stage === 'stored' || seed.stage === 'closed' ? `cus-seed-${index + 1}` : null,
    address: seed.address,
    lines: seed.lines,
    whatsappPhoto: seed.whatsappPhoto ?? null,
    notes: seed.notes ?? '',
    supplierStatus: 'none' as const,
  }))
}

export function createSeedCustomers(now: Date = new Date()): Customer[] {
  return createSeedOrders(now)
    .filter((order) => order.customerId !== null)
    .map((order) => ({
      ...order.customer,
      id: order.customerId ?? '',
      createdAt: order.receivedAt,
    }))
}

export function createSeedActivity(now: Date = new Date()): Activity[] {
  return createSeedOrders(now)
    .filter((order) => order.stage !== 'review')
    .map((order) => ({
      id: `act-seed-${order.id}`,
      at: order.receivedAt,
      title: order.stage === 'incomplete' ? 'Pedido con datos incompletos' : 'Pedido registrado',
      detail: `${order.reference} · ${order.customer.name}`,
      tone: order.stage === 'incomplete' ? ('warning' as const) : ('success' as const),
      orderId: order.id,
    }))
}
