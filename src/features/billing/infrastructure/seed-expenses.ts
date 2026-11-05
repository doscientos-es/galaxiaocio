import { localDate, type Expense } from '../application/expense'

export function createSeedExpenses(now = new Date()): Expense[] {
  const descriptions = ['Compra de mercancía', 'Alquiler del almacén', 'Suministros', 'Material de embalaje']
  const suppliers = ['Equipamiento Norte', 'Gestión de locales', 'Comercializadora', 'Suministros Costa']
  return Array.from({ length: 18 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - Math.floor(index / 3), Math.min(now.getDate(), 5 + (index % 3) * 7))
    const netCents = [75000, 90000, 12000, 18000][index % 4] ?? 75000
    return {
      id: `expense-seed-${index + 1}`, date: localDate(date),
      description: descriptions[index % 4] ?? 'Compra de mercancía', supplier: suppliers[index % 4] ?? 'Equipamiento Norte',
      netCents, vatCents: Math.round(netCents * 0.21),
      source: index % 4 === 0 ? 'stock' : 'manual', reference: '',
    }
  })
}