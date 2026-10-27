/** Short unique identifier with a readable prefix, e.g. `line-3f9a2c1b`. */
export const createId = (prefix: string): string => `${prefix}-${crypto.randomUUID().slice(0, 8)}`

/** Zero-padded sequential reference such as `PED-2026-0007`. */
export const formatReference = (prefix: string, year: number, sequence: number): string =>
  `${prefix}-${year}-${String(sequence).padStart(4, '0')}`
