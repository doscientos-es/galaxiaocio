import { Field, FieldDescription, FieldLabel, Input, toast } from '@doscientos/ui'
import { useState } from 'react'
import { z } from 'zod'

import { createId } from '@/shared/lib/ids'
import { FormDialog } from '@/shared/ui/form-dialog'

import type { Product } from '../application/product'
import { safeSupplierUrl } from '../application/purchase'
import { supplierId } from '../application/supplier'
import { useCatalog } from '../application/use-catalog'

export function CatalogProductDialog({
  product,
  onClose,
}: {
  product: Product | undefined
  onClose: () => void
}) {
  const { products, suppliers, saveProductDetails, saveSupplier } = useCatalog()
  const contact = suppliers.find((item) => item.id === supplierId(product?.supplier ?? ''))
  const [sku, setSku] = useState(product?.sku ?? '')
  const [name, setName] = useState(product?.name ?? '')
  const [price, setPrice] = useState(product ? String(product.priceCents / 100) : '')
  const [weight, setWeight] = useState(product ? String(product.weightKg) : '')
  const [minimum, setMinimum] = useState(product ? String(product.minStock) : '0')
  const [fulfillment, setFulfillment] = useState<Product['fulfillment']>(
    product?.fulfillment ?? 'own_stock',
  )
  const [supplier, setSupplier] = useState(product?.supplier ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [url, setUrl] = useState(contact?.url ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function changeSupplier(value: string) {
    setSupplier(value)
    const existing = suppliers.find((item) => item.id === supplierId(value))
    setEmail(existing?.email ?? '')
    setUrl(existing?.url ?? '')
  }

  async function submit() {
    const normalizedSku = sku.trim()
    const priceValue = Number(price.replace(',', '.'))
    const weightValue = Number(weight.replace(',', '.'))
    const minimumValue = Number(minimum)
    if (
      !normalizedSku ||
      !name.trim() ||
      !price.trim() ||
      !weight.trim() ||
      !minimum.trim() ||
      !Number.isFinite(priceValue) ||
      priceValue < 0 ||
      !Number.isFinite(weightValue) ||
      weightValue < 0 ||
      !Number.isSafeInteger(minimumValue) ||
      minimumValue < 0 ||
      !Number.isSafeInteger(Math.round(priceValue * 100))
    ) {
      setError('Completa la referencia, el nombre y los valores numéricos válidos.')
      return
    }
    if (
      products.some(
        (item) => item.id !== product?.id && item.sku.toLowerCase() === normalizedSku.toLowerCase(),
      )
    ) {
      setError('Ya existe un artículo con esa referencia.')
      return
    }
    if (
      (!supplier.trim() && (email.trim() || url.trim())) ||
      (email.trim() && !z.string().email().safeParse(email.trim()).success) ||
      (url.trim() && !safeSupplierUrl(url.trim()))
    ) {
      setError('Comprueba el proveedor, el email y la dirección web (http o https).')
      return
    }
    setSaving(true)
    try {
      if (supplier.trim())
        await saveSupplier({
          id: supplierId(supplier),
          name: supplier.trim(),
          email: email.trim(),
          url: url.trim(),
        })
      await saveProductDetails({
        id: product?.id ?? createId('product'),
        sku: normalizedSku,
        name: name.trim(),
        stock: product?.stock ?? 0,
        minStock: minimumValue,
        priceCents: Math.round(priceValue * 100),
        weightKg: weightValue,
        fulfillment,
        supplier: supplier.trim() || null,
      })
      toast.success('Artículo guardado')
      onClose()
    } catch {
      setError('No se ha podido guardar el artículo. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={product ? 'Editar artículo' : 'Nuevo artículo'}
      description="Datos del catálogo y contacto compartido del proveedor."
      size="lg"
      loading={saving}
      onSubmit={() => void submit()}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="catalog-sku">Referencia / SKU</FieldLabel>
          <Input
            id="catalog-sku"
            value={sku}
            disabled={!!product}
            placeholder="Ej. VIT-REF"
            onChange={(event) => setSku(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="catalog-name">Artículo</FieldLabel>
          <Input
            id="catalog-name"
            value={name}
            placeholder="Nombre del artículo"
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="catalog-price">Precio de venta (€)</FieldLabel>
          <Input
            id="catalog-price"
            inputMode="decimal"
            value={price}
            placeholder="Ej. 125,50"
            onChange={(event) => setPrice(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="catalog-weight">Peso (kg)</FieldLabel>
          <Input
            id="catalog-weight"
            inputMode="decimal"
            value={weight}
            placeholder="Ej. 12"
            onChange={(event) => setWeight(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="catalog-min">Stock mínimo</FieldLabel>
          <Input
            id="catalog-min"
            inputMode="numeric"
            value={minimum}
            onChange={(event) => setMinimum(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="catalog-fulfillment">Disponibilidad</FieldLabel>
          <select
            id="catalog-fulfillment"
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            value={fulfillment}
            onChange={(event) => setFulfillment(event.target.value as Product['fulfillment'])}
          >
            <option value="own_stock">Stock propio</option>
            <option value="external_supplier">Bajo pedido al proveedor</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="catalog-supplier">Proveedor</FieldLabel>
          <Input
            id="catalog-supplier"
            value={supplier}
            list="catalog-suppliers"
            placeholder="Nombre del proveedor"
            onChange={(event) => changeSupplier(event.target.value)}
          />
          <datalist id="catalog-suppliers">
            {suppliers.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </datalist>
        </Field>
        <Field>
          <FieldLabel htmlFor="catalog-email">Email del proveedor</FieldLabel>
          <Input
            id="catalog-email"
            type="email"
            value={email}
            placeholder="compras@proveedor.es"
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="catalog-url">Web del proveedor</FieldLabel>
          <Input
            id="catalog-url"
            type="url"
            value={url}
            placeholder="https://proveedor.es"
            onChange={(event) => setUrl(event.target.value)}
          />
          <FieldDescription>
            El email y la web se comparten entre los artículos de este proveedor.
          </FieldDescription>
        </Field>
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </FormDialog>
  )
}
