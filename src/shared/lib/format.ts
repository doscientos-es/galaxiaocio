const currency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
const date = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTime = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export const formatCents = (cents: number): string => currency.format(cents / 100)
export const formatDate = (iso: string): string => date.format(new Date(iso))
export const formatDateTime = (iso: string): string => dateTime.format(new Date(iso))
export const formatKg = (kg: number): string =>
  `${kg.toLocaleString('es-ES', { maximumFractionDigits: 1 })} kg`
