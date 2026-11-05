import { formatReference } from '../ids'

export const demoSuppliers = [
  { id: 'equipamiento norte', name: 'Equipamiento Norte', email: 'pedidos@equipamiento.example', url: '' },
  { id: 'hosteleria central', name: 'Hostelería Central', email: 'ventas@hosteleriacentral.example', url: '' },
  { id: 'suministros costa', name: 'Suministros Costa', email: 'comercial@suministroscosta.example', url: '' },
]

const productRows: Array<[string, string, number, number, number, number]> = [
  ['NEV-400', 'Armario refrigerado 400 L', 4, 2, 1190, 78],
  ['CON-300', 'Congelador vertical 300 L', 3, 1, 899, 65],
  ['PLA-600', 'Plancha eléctrica 60 cm', 5, 2, 420, 22],
  ['GRI-600', 'Grill de contacto doble', 6, 2, 275, 18],
  ['CAF-2G', 'Cafetera profesional 2 grupos', 2, 1, 2450, 48],
  ['MOL-01', 'Molinillo de café profesional', 7, 2, 385, 12],
  ['FRE-8L', 'Freidora eléctrica 8 L', 8, 3, 189, 9],
  ['LAV-VAS', 'Lavavasos industrial', 3, 1, 1290, 55],
  ['HOR-PIZ', 'Horno para pizza 4 unidades', 2, 1, 1590, 90],
  ['AMAS-10', 'Amasadora de 10 L', 4, 1, 760, 38],
  ['BAT-MAN', 'Batidora de mano profesional', 9, 3, 175, 4],
  ['TER-80', 'Termo eléctrico 80 L', 5, 2, 310, 26],
  ['FRE-MUR', 'Fregadero mural de un seno', 4, 1, 295, 24],
  ['EST-150', 'Estantería inox 150 cm', 8, 3, 210, 20],
  ['CAR-3N', 'Carro de servicio tres niveles', 6, 2, 149, 14],
  ['VIT-90', 'Vitrina refrigerada 90 cm', 2, 1, 980, 58],
  ['MIC-25', 'Microondas profesional 25 L', 5, 2, 370, 19],
  ['TOST-4', 'Tostador de cuatro ranuras', 7, 2, 115, 5],
  ['ENV-VAC', 'Envasadora al vacío de mesa', 3, 1, 640, 27],
  ['CUT-5L', 'Cutter de cocina 5 L', 5, 2, 325, 11],
  ['BAL-30', 'Balanza digital 30 kg', 10, 3, 89, 3],
  ['OLLA-50', 'Olla industrial 50 L', 12, 4, 98, 6],
  ['SART-32', 'Sartén profesional 32 cm', 18, 5, 42, 2],
  ['BAN-GN', 'Bandeja gastronorm inox', 30, 8, 22, 1],
]

export const demoProducts = productRows.map(([sku, name, stock, minStock, euros, weightKg], index) => ({
  id: sku.toLowerCase(), sku, name, stock, minStock, priceCents: euros * 100, weightKg,
  fulfillment: 'own_stock' as const, supplier: demoSuppliers[index % demoSuppliers.length]?.name ?? '',
}))

const customerRows = [
  ['Restaurante La Plazuela', 'Madrid', '28010'],
  ['Hotel Mirador del Río', 'Zaragoza', '50003'],
  ['Cafetería La Alameda', 'Sevilla', '41001'],
  ['Taberna El Olivar', 'Córdoba', '14003'],
  ['Bistró La Estación', 'Valencia', '46004'],
  ['Restaurante La Encina', 'Valladolid', '47001'],
  ['Hotel Paseo del Parque', 'Málaga', '29015'],
  ['Panadería Horno del Barrio', 'Barcelona', '08012'],
  ['Pizzería La Terraza', 'Murcia', '30001'],
  ['Bar La Ribera', 'Bilbao', '48005'],
  ['Catering La Huerta', 'Granada', '18001'],
  ['Café Plaza Mayor', 'Salamanca', '37002'],
] as const

export function createDemoScenarios(now: Date = new Date()) {
  return Array.from({ length: 36 }, (_, index) => {
    const customerIndex = index % customerRows.length
    const [name, city, postalCode] = customerRows[customerIndex] ?? customerRows[0]
    const stage = index < 12 ? 'stored' as const : index < 24 ? 'shipped' as const : 'closed' as const
    const hours = 72 + index * 24
    const at = (offset: number) => new Date(now.getTime() - (hours - offset) * 3_600_000).toISOString()
    const products = [demoProducts[(index * 3) % demoProducts.length], demoProducts[(index * 3 + 5) % demoProducts.length]]
    if (products.some((product) => !product)) throw new Error('Faltan productos iniciales')
    return {
      id: `ord-demo-${index + 1}`,
      reference: formatReference('PED', now.getFullYear(), index + 7),
      customerId: `cus-demo-${customerIndex + 1}`,
      customer: { name, taxId: `B${String(20000000 + customerIndex).padStart(8, '0')}`, email: `cliente${customerIndex + 1}@galaxiaocio.example`, phone: `600${String(100000 + customerIndex).padStart(6, '0')}` },
      address: { street: `Calle Comercio ${customerIndex + 1}`, postalCode, city, country: 'ES' },
      channel: (['web', 'email', 'manual'] as const)[index % 3] ?? 'web',
      stage, receivedAt: at(0), shippedAt: at(12), issuedAt: at(18), deliveredAt: at(21),
      lines: products.map((product, lineIndex) => {
        if (!product) throw new Error('Falta un producto inicial')
        return {
          id: `line-demo-${index + 1}-${lineIndex + 1}`, sku: product.sku, description: product.name,
          quantity: 1 + ((index + lineIndex) % 3), unitCents: product.priceCents, weightKg: product.weightKg,
        }
      }),
    }
  })
}