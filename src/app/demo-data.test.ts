// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'

import { repositories, resetDemoData } from './repositories'

afterEach(() => localStorage.clear())

describe('demo data reset', () => {
  it('restores a coherent catalogue, customer history, shipments and documents', async () => {
    for (const key of ['orders', 'customers', 'products', 'suppliers', 'shipments', 'documents', 'expenses']) {
      localStorage.setItem(`galaxiaocio-demo:v1:${key}`, '[]')
    }
    await resetDemoData()
    const [orders, customers, products, suppliers, shipments, documents] = await Promise.all([
      repositories.orders.orders.list(), repositories.orders.customers.list(),
      repositories.catalog.products.list(), repositories.catalog.suppliers.list(),
      repositories.shipping.shipments.list(), repositories.billing.documents.list(),
    ])

    expect(orders.length).toBeGreaterThan(40)
    expect(customers.length).toBeGreaterThan(15)
    expect(products.length).toBeGreaterThan(30)
    expect(suppliers.length).toBeGreaterThan(4)
    expect((await repositories.billing.expenses.list()).length).toBeGreaterThan(10)
    expect(new Set(orders.map((order) => order.reference)).size).toBe(orders.length)
    expect(new Set(customers.map((customer) => customer.id)).size).toBe(customers.length)
    expect(new Set(products.map((product) => product.sku)).size).toBe(products.length)
    expect(new Set(documents.map((document) => document.number)).size).toBe(documents.length)

    for (const order of orders.filter((item) => item.id.startsWith('ord-demo-'))) {
      expect(customers.find((customer) => customer.id === order.customerId)?.name).toBe(order.customer.name)
      for (const line of order.lines) expect(products.some((product) => product.sku === line.sku)).toBe(true)
      const shipment = shipments.find((item) => item.orderId === order.id)
      const ownDocuments = documents.filter((item) => item.orderId === order.id)
      if (order.stage === 'stored') {
        expect(shipment).toBeUndefined()
        expect(ownDocuments).toHaveLength(0)
      } else {
        expect(shipment).toBeDefined()
        expect(shipment!.createdAt >= order.receivedAt).toBe(true)
        expect(ownDocuments).toHaveLength(order.stage === 'closed' ? 2 : 0)
        for (const document of ownDocuments) {
          expect(document.orderReference).toBe(order.reference)
          expect(document.netCents).toBe(order.lines.reduce((sum, line) =>
            sum + line.quantity * (products.find((product) => product.sku === line.sku)?.priceCents ?? 0), 0))
          expect(document.totalCents).toBe(document.netCents + document.vatCents)
        }
      }
    }
    for (const product of products.filter((item) => item.supplier)) {
      expect(suppliers.some((supplier) => supplier.name === product.supplier)).toBe(true)
    }
    expect(customers.some((customer) => orders.filter((order) => order.customerId === customer.id).length > 1)).toBe(true)
  })
})