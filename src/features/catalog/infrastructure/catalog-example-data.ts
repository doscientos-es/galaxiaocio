import type { KeyValueStore } from '@/shared/lib/storage/key-value-store'

import { productSchema } from '../application/product'
import { supplierSchema, type Supplier } from '../application/supplier'
import { createSeedProducts, exampleStockSupplier } from './seed-products'

export function createSeedSuppliers(): [Supplier, Supplier] {
  return [
    { id: 'fm industrial', name: 'FM Industrial', email: 'fm@example.com', url: '' },
    {
      id: 'distribuciones de ejemplo',
      name: exampleStockSupplier,
      email: 'pedidos@example.com',
      url: '',
    },
  ]
}

/** Upgrade existing example data once, without overwriting user-provided suppliers or contacts. */
export function withExampleContacts(store: KeyValueStore): KeyValueStore {
  return {
    ...store,
    async read(key) {
      const raw = await store.read(key)
      if (key !== 'products' && key !== 'suppliers') return raw
      const marker = `example-contacts-v1:${key}`
      if (await store.read(marker)) return raw

      if (key === 'products') {
        const parsed = productSchema.array().safeParse(raw)
        if (parsed.success) {
          const exampleProducts = new Map(
            createSeedProducts().map((product) => [product.id, product]),
          )
          const products = parsed.data.map((product) => {
            const example = exampleProducts.get(product.id)
            return example?.sku === product.sku &&
              product.fulfillment === 'own_stock' &&
              !product.supplier
              ? { ...product, supplier: exampleStockSupplier }
              : product
          })
          await store.write(key, products)
          await store.write(marker, true)
          return products
        }
      } else {
        const parsed = supplierSchema.array().safeParse(raw)
        if (parsed.success) {
          const examples = createSeedSuppliers()
          const suppliers = parsed.data.map((supplier) =>
            supplier.id === 'fm industrial' && !supplier.email.trim()
              ? { ...supplier, email: examples[0].email }
              : supplier,
          )
          const stockSupplier = examples[1]
          if (!suppliers.some((supplier) => supplier.id === stockSupplier.id))
            suppliers.push(stockSupplier)
          await store.write(key, suppliers)
          await store.write(marker, true)
          return suppliers
        }
      }
      await store.write(marker, true)
      return raw
    },
  }
}
