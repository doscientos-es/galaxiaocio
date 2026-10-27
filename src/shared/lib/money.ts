export const VAT_RATE = 0.21

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
