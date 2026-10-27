import type { Product } from '../application/product'

type SeedRow = [
  sku: string,
  name: string,
  stock: number,
  minStock: number,
  priceEuros: number,
  weightKg: number,
]

const ownStock: SeedRow[] = [
  ['FRY-2X8', 'Freidora eléctrica doble 2 × 8 L', 6, 2, 349, 18],
  ['CMP-120', 'Campana extractora inox 120 cm', 3, 2, 425, 24],
  ['MES-180', 'Mesa de trabajo acero inox 180 cm', 9, 3, 219, 28],
  ['COR-300', 'Cortafiambres profesional 300 mm', 4, 2, 289, 14],
  ['LAV-500', 'Lavavajillas de capota 500 × 500', 2, 1, 1640, 95],
  ['FOG-4F', 'Fogón a gas 4 fuegos', 5, 2, 599, 47],
  ['VIT-REF', 'Vitrina refrigerada 120 cm', 1, 1, 1285, 70],
  ['BAT-020', 'Batidora amasadora 20 L', 7, 2, 799, 52],
  ['GN-11X6', 'Cubeta GN 1/1 inox (pack 6)', 40, 10, 49, 3],
]

export function createSeedProducts(): Product[] {
  const base = ownStock.map(([sku, name, stock, minStock, priceEuros, weightKg]) => ({
    id: sku.toLowerCase(),
    sku,
    name,
    stock,
    minStock,
    priceCents: priceEuros * 100,
    weightKg,
    fulfillment: 'own_stock' as const,
    supplier: null,
  }))
  const external: Product = {
    id: 'hrn-fm6',
    sku: 'HRN-FM6',
    name: 'Horno de convección FM 6 bandejas',
    stock: 0,
    minStock: 0,
    priceCents: 189000,
    weightKg: 62,
    fulfillment: 'external_supplier',
    supplier: 'FM Industrial',
  }
  return [external, ...base]
}
