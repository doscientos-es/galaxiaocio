import type { Order } from './order'

export type OrderIssueField =
  | 'customer.name'
  | 'customer.contact'
  | 'address.street'
  | 'address.postalCode'
  | 'address.city'
  | 'lines'
  | `line:${string}`

export interface OrderIssue {
  field: OrderIssueField
  message: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isValidEmail = (value: string): boolean => emailPattern.test(value.trim())
export const isValidPhone = (value: string): boolean => value.replaceAll(/\D/g, '').length >= 9

/**
 * "Are the customer, address and items correctly identified?" — the decision of the
 * validation step. Every issue names the field so the UI can point at it.
 */
export function validateOrder(
  order: Pick<Order, 'customer' | 'address' | 'lines'>,
  knownSkus: ReadonlySet<string>,
): OrderIssue[] {
  const issues: OrderIssue[] = []
  const { customer, address, lines } = order

  if (customer.name.trim().length < 2) {
    issues.push({ field: 'customer.name', message: 'Falta el nombre del cliente.' })
  }
  if (!isValidEmail(customer.email) && !isValidPhone(customer.phone)) {
    issues.push({ field: 'customer.contact', message: 'Indica un email o un teléfono válido.' })
  }
  if (address.street.trim().length < 3) {
    issues.push({ field: 'address.street', message: 'Falta la dirección de entrega.' })
  }
  const postalCodeIsValid =
    address.country === 'ES'
      ? /^\d{5}$/.test(address.postalCode.trim())
      : address.postalCode.trim() !== ''
  if (!postalCodeIsValid) {
    issues.push({ field: 'address.postalCode', message: 'El código postal no es válido.' })
  }
  if (address.city.trim() === '') {
    issues.push({ field: 'address.city', message: 'Falta la población.' })
  }
  if (lines.length === 0) {
    issues.push({ field: 'lines', message: 'El pedido no tiene artículos.' })
  }
  for (const line of lines) {
    if (!knownSkus.has(line.sku)) {
      issues.push({ field: `line:${line.id}`, message: 'Artículo sin identificar en el catálogo.' })
    } else if (line.quantity < 1) {
      issues.push({ field: `line:${line.id}`, message: 'La cantidad debe ser al menos 1.' })
    }
  }
  return issues
}
