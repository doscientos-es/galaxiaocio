import type { Collection } from '@/shared/lib/storage/collection'

import type { Product } from './product'

/** Catalog edits must never overwrite stock reserved or received while the form was open. */
export function saveCatalogProduct(
  products: Collection<Product>,
  product: Product,
): Promise<Product> {
  return products.mutate((items) => {
    if (
      items.some(
        (item) => item.id !== product.id && item.sku.toLowerCase() === product.sku.toLowerCase(),
      )
    ) {
      throw new Error('Ya existe un artículo con esa referencia.')
    }
    const current = items.find((item) => item.id === product.id)
    const saved = { ...product, stock: current?.stock ?? 0 }
    return {
      items: current
        ? items.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...items],
      result: saved,
    }
  })
}
