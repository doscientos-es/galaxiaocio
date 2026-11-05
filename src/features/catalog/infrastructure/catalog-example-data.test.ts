import { describe, expect, it } from 'vitest'

import { createMemoryStore } from '@/shared/lib/storage/memory-store'

import { createLocalCatalogRepository } from './local-catalog-repository'
import { createSeedProducts, exampleStockSupplier } from './seed-products'

describe('example supplier contacts', () => {
  it('provides example contacts for the initial catalog', async () => {
    const catalog = createLocalCatalogRepository(createMemoryStore())
    const suppliers = await catalog.suppliers.list()
    const products = await catalog.products.list()
    expect(suppliers.find((supplier) => supplier.name === 'FM Industrial')?.email).toBe(
      'fm@example.com',
    )
    expect(suppliers.find((supplier) => supplier.name === exampleStockSupplier)?.email).toBe(
      'pedidos@example.com',
    )
    expect(products.find((product) => product.sku === 'VIT-REF')?.supplier).toBe(
      exampleStockSupplier,
    )
  })

  it('updates old examples once without overwriting user data or restoring cleared emails', async () => {
    const store = createMemoryStore()
    const products = createSeedProducts().map((product) =>
      product.fulfillment === 'own_stock' ? { ...product, supplier: null } : product,
    )
    const vitrina = products.find((product) => product.sku === 'VIT-REF')
    if (!vitrina) throw new Error('Missing example product')
    const custom = { ...vitrina, id: 'custom', sku: 'CUSTOM', supplier: null }
    await store.write('products', [...products, custom])
    await store.write('suppliers', [
      { id: 'fm industrial', name: 'FM Industrial', email: '', url: 'https://fm.example' },
      { id: 'other', name: 'Other', email: 'real@example.org', url: '' },
    ])
    const catalog = createLocalCatalogRepository(store)
    expect((await catalog.products.get(vitrina.id))?.supplier).toBe(exampleStockSupplier)
    expect((await catalog.products.get(custom.id))?.supplier).toBeNull()
    const fm = await catalog.suppliers.get('fm industrial')
    if (!fm) throw new Error('Missing example supplier')
    expect(fm).toMatchObject({ email: 'fm@example.com', url: 'https://fm.example' })
    expect(await catalog.suppliers.get('other')).toMatchObject({ email: 'real@example.org' })
    await catalog.suppliers.upsert({ ...fm, email: '' })
    const reopened = createLocalCatalogRepository(store)
    expect((await reopened.suppliers.get('fm industrial'))?.email).toBe('')
  })

  it('keeps an existing supplier email', async () => {
    const store = createMemoryStore()
    await store.write('suppliers', [
      { id: 'fm industrial', name: 'FM Industrial', email: 'real@example.org', url: '' },
    ])
    const catalog = createLocalCatalogRepository(store)
    expect((await catalog.suppliers.get('fm industrial'))?.email).toBe('real@example.org')
  })
})
