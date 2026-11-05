export const VAT_RATE = 0.21

export function parseEuros(value: string): number | undefined {
  const text = value.trim().replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return undefined
  const cents = Math.round(Number(text) * 100)
  return Number.isSafeInteger(cents) ? cents : undefined
}

export interface Totals {
  netCents: number
  vatCents: number
  totalCents: number
}

/** Adds VAT to a net amount. Rounding happens once, on the total, so documents always add up. */
export function splitVat(netCents: number): Totals {
  const vatCents = Math.round(netCents * VAT_RATE)
  return { netCents, vatCents, totalCents: netCents + vatCents }
}
