import { createMemoryHistory, RouterProvider, createRouter } from '@tanstack/react-router'
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { routeTree } from '@/routeTree.gen'
import { createSeedProducts } from '@/features/catalog/infrastructure/seed-products'
import { createSeedCustomers, createSeedOrders } from '@/features/orders/infrastructure/seed-orders'

import { AppProviders, queryClient } from './providers'

beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  globalThis.ResizeObserver = class {
    observe() { }
    unobserve() { }
    disconnect() { }
  }
  Element.prototype.scrollIntoView = () => undefined
})

afterEach(() => {
  cleanup()
  // Every test starts from the initial demo data.
  localStorage.clear()
  queryClient.clear()
})

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

describe('demo flow', () => {
  it('registers a stock purchase once with its real amounts and shows it in accounting', async () => {
    localStorage.setItem('galaxiaocio-demo:v1:expenses', '[]')
    const user = userEvent.setup()
    renderAt('/stock')
    await user.click(await screen.findByRole('button', { name: 'Pedir más Vitrina refrigerada 120 cm' }))
    const dialog = await screen.findByRole('dialog', { name: 'Pedir más' })
    await user.clear(within(dialog).getByLabelText('Unidades de compra'))
    await user.type(within(dialog).getByLabelText('Unidades de compra'), '3')
    await user.type(within(dialog).getByLabelText('Base de compra Distribuciones de ejemplo'), '100,00')
    await user.type(within(dialog).getByLabelText('IVA de compra Distribuciones de ejemplo'), '21')
    await user.click(within(dialog).getByRole('button', { name: 'Registrar compra y gasto' }))
    expect(await within(dialog).findByRole('button', { name: 'Compra registrada' })).toBeDisabled()
    const expenses = JSON.parse(localStorage.getItem('galaxiaocio-demo:v1:expenses') ?? '[]')
    expect(expenses).toHaveLength(1)
    expect(expenses[0]).toMatchObject({ netCents: 10000, vatCents: 2100, source: 'stock', description: expect.stringContaining('3 × Vitrina') })
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Contabilidad' }))
    expect(await screen.findByText(/3 × Vitrina refrigerada 120 cm/)).toBeTruthy()
  })

  it('creates, edits and removes a manual expense', async () => {
    localStorage.setItem('galaxiaocio-demo:v1:expenses', '[]')
    const user = userEvent.setup()
    renderAt('/administracion')
    await user.click(await screen.findByRole('button', { name: 'Nuevo gasto' }))
    let dialog = await screen.findByRole('dialog', { name: 'Nuevo gasto' })
    await user.type(within(dialog).getByLabelText('Concepto'), 'Internet')
    await user.type(within(dialog).getByLabelText('Base (€)'), '50')
    await user.type(within(dialog).getByLabelText('IVA (€)'), '10,50')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Internet')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Editar Internet' }))
    dialog = await screen.findByRole('dialog', { name: 'Editar gasto' })
    await user.clear(within(dialog).getByLabelText('Base (€)'))
    await user.type(within(dialog).getByLabelText('Base (€)'), '60')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem('galaxiaocio-demo:v1:expenses') ?? '[]')[0].netCents).toBe(6000))
    await user.click(screen.getByRole('button', { name: 'Eliminar Internet' }))
    const confirmation = await screen.findByRole('alertdialog', { name: 'Eliminar gasto' })
    await user.click(within(confirmation).getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(screen.queryByText('Internet')).toBeNull())
    expect(JSON.parse(localStorage.getItem('galaxiaocio-demo:v1:expenses') ?? '[]')).toHaveLength(0)
  })

  it.each(['none', 'notified'] as const)(
    'requests supplier stock and records receipt without notifying a team (%s)',
    async (supplierStatus) => {
      const orders = createSeedOrders().map((order) =>
        order.id === 'ord-seed-5' ? { ...order, supplierStatus } : order,
      )
      localStorage.setItem('galaxiaocio-demo:v1:orders', JSON.stringify(orders))
      const user = userEvent.setup()
      renderAt('/pedidos/ord-seed-5')
      await user.click(await screen.findByRole('button', { name: 'Pedir stock faltante' }))
      const dialog = await screen.findByRole('dialog', { name: 'Pedir stock faltante' })
      expect(within(dialog).getAllByText(/Horno de convección FM 6 bandejas/).length).toBeGreaterThan(0)
      await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
      expect(screen.queryByText(/equipo avisado|avisar al equipo/i)).toBeNull()
      expect(screen.queryByRole('button', { name: 'Preparar expedición' })).toBeNull()
      await user.click(screen.getByRole('button', { name: 'Marcar como recibido del proveedor' }))
      expect(await screen.findByRole('button', { name: 'Preparar expedición' })).toBeTruthy()
    },
  )

  it('prepares a stock request with an example supplier email', async () => {
    const user = userEvent.setup()
    renderAt('/pedidos/ord-seed-4')
    await user.click(await screen.findByRole('button', { name: 'Pedir stock faltante' }))
    const dialog = await screen.findByRole('dialog', { name: 'Pedir stock faltante' })
    expect(within(dialog).getByText('Distribuciones de ejemplo')).toBeTruthy()
    expect(within(dialog).getByText('Email: pedidos@example.com')).toBeTruthy()
    expect(within(dialog).getByText(/son de prueba/)).toBeTruthy()
    expect(
      within(dialog).getByRole('link', { name: 'Abrir correo al proveedor' }).getAttribute('href'),
    ).toContain('mailto:pedidos%40example.com')
  })

  it('offers stock purchasing and reception actions for the appropriate products', async () => {
    const user = userEvent.setup()
    renderAt('/stock')
    const receive = await screen.findByRole('button', { name: 'Registrar recepción de Vitrina refrigerada 120 cm' })
    const row = receive.closest('tr')
    if (!row) throw new Error('No se encontró la fila del artículo')
    const purchase = within(row).getByRole('button', { name: 'Pedir más Vitrina refrigerada 120 cm' })
    await user.click(receive)
    let dialog = await screen.findByRole('dialog', { name: 'Registrar recepción' })
    expect(within(dialog).getByLabelText('Unidades recibidas')).toBeTruthy()
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await user.click(purchase)
    dialog = await screen.findByRole('dialog', { name: 'Pedir más' })
    expect(within(dialog).getAllByText(/Vitrina refrigerada 120 cm/).length).toBeGreaterThan(0)
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('button', { name: 'Registrar recepción de Horno de convección FM 6 bandejas' })).toBeNull()
  })

  it('searches, filters and paginates catalog products without losing edit actions', async () => {
    const [external, stock] = createSeedProducts()
    if (!external || !stock) throw new Error('Faltan artículos')
    const products = Array.from({ length: 21 }, (_, index) => ({
      ...(index === 20 ? external : stock),
      id: `product-${index}`,
      sku: `SKU-${String(index + 1).padStart(2, '0')}`,
      name: `Artículo ${String(index + 1).padStart(2, '0')}`,
    }))
    localStorage.setItem('galaxiaocio-demo:v1:products', JSON.stringify(products))
    const user = userEvent.setup()
    renderAt('/catalogo')
    expect(await screen.findByText('1–10 de 21 artículos')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(screen.getByText('11–20 de 21 artículos')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Buscar artículos'), { target: { value: 'SKU-21' } })
    expect(await screen.findByText('Artículo 21')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Editar Artículo 21' }))
    expect(await screen.findByRole('dialog', { name: 'Editar artículo' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(await screen.findByText('1–10 de 21 artículos')).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: /Proveedor externo/ }))
    expect(screen.getByText('Artículo 21')).toBeTruthy()
    expect(screen.queryByText('Artículo 01')).toBeNull()
    fireEvent.change(screen.getByLabelText('Buscar artículos'), { target: { value: 'fm@example.com' } })
    expect(screen.getByText('Artículo 21')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Buscar artículos'), { target: { value: 'sin coincidencias' } })
    expect(screen.getByText('No hay artículos en esta vista')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Limpiar' }))
    await user.click(screen.getByRole('tab', { name: /Stock propio/ }))
    expect(screen.getByText('1–10 de 20 artículos')).toBeTruthy()
    expect(screen.queryByText('Artículo 21')).toBeNull()
  })

  it('adds a catalog product without inventing supplier contact or stock', async () => {
    const user = userEvent.setup()
    renderAt('/catalogo')
    await user.click(await screen.findByRole('button', { name: 'Nuevo artículo' }))
    await user.type(screen.getByLabelText('Referencia / SKU'), 'NEW-001')
    await user.type(screen.getByLabelText('Artículo'), 'Artículo nuevo')
    await user.type(screen.getByLabelText('Precio de venta (€)'), '99,50')
    await user.type(screen.getByLabelText('Peso (kg)'), '5')
    await user.type(screen.getByLabelText('Proveedor'), 'Proveedor nuevo')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(await screen.findByText('Artículo nuevo')).toBeTruthy()
    const products = JSON.parse(localStorage.getItem('galaxiaocio-demo:v1:products') ?? '[]') as Array<{ sku: string; stock: number; priceCents: number }>
    expect(products.find((item) => item.sku === 'NEW-001')).toMatchObject({ stock: 0, priceCents: 9950 })
    const suppliers = JSON.parse(localStorage.getItem('galaxiaocio-demo:v1:suppliers') ?? '[]') as Array<{ name: string; email: string }>
    expect(suppliers.find((item) => item.name === 'Proveedor nuevo')?.email).toBe('')
  })

  it('saves supplier contact details and prepares a shortage request without changing stock', async () => {
    const user = userEvent.setup()
    renderAt('/catalogo')
    await user.click(await screen.findByRole('button', { name: 'Editar Vitrina refrigerada 120 cm' }))
    await user.clear(screen.getByLabelText('Proveedor'))
    await user.type(screen.getByLabelText('Proveedor'), 'Proveedor prueba')
    await user.type(screen.getByLabelText('Email del proveedor'), 'ventas@example.com')
    await user.type(screen.getByLabelText('Web del proveedor'), 'https://proveedor.example')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(await screen.findByText('ventas@example.com')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Stock' }))
    await user.click(await screen.findByRole('button', { name: 'Pedir más Vitrina refrigerada 120 cm' }))
    let dialog = await screen.findByRole('dialog', { name: 'Pedir más' })
    expect(within(dialog).getByText('ventas@example.com', { exact: false })).toBeTruthy()
    expect(within(dialog).getByRole('link', { name: 'Ir al proveedor' }).getAttribute('href')).toBe('https://proveedor.example/')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    cleanup()
    renderAt('/pedidos/ord-seed-4')
    await user.click(await screen.findByRole('button', { name: 'Pedir stock faltante' }))
    dialog = await screen.findByRole('dialog', { name: 'Pedir stock faltante' })
    expect(within(dialog).getByText('Proveedor prueba')).toBeTruthy()
    expect(within(dialog).getAllByText(/1 × Vitrina refrigerada 120 cm/).length).toBeGreaterThan(0)
    await user.click(within(dialog).getByRole('button', { name: 'Copiar mensaje' }))
    expect(await navigator.clipboard.readText()).toContain('1 × Vitrina refrigerada 120 cm (VIT-REF)')
    expect(within(dialog).getByRole('link', { name: 'Abrir correo al proveedor' }).getAttribute('href')).toContain('mailto:ventas%40example.com')
    const products = JSON.parse(localStorage.getItem('galaxiaocio-demo:v1:products') ?? '[]') as Array<{ sku: string; stock: number }>
    expect(products.find((item) => item.sku === 'VIT-REF')?.stock).toBe(1)
  })
  it('shows the operational dashboard without the demo guide', async () => {
    renderAt('/resumen')
    expect(await screen.findByText('Pendiente de ti')).toBeTruthy()
    expect(screen.getByText('Actividad reciente')).toBeTruthy()
    expect(screen.queryByText('Recorrido sugerido para la demo')).toBeNull()
    expect(screen.queryByText('Demo con datos de ejemplo')).toBeNull()
  })

  it('lists the seeded orders from every channel', async () => {
    renderAt('/pedidos')
    expect(await screen.findByText('Makro Alcobendas')).toBeTruthy()
    expect(screen.getByText('Hotel Costa Brava SL')).toBeTruthy()
    expect(screen.getAllByText('Datos incompletos').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Nuevo pedido' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Recibir pedido' })).toBeNull()
  })

  it('navigates from an order customer to their orders and back', async () => {
    const user = userEvent.setup()
    const order = createSeedOrders()[0]
    if (!order) throw new Error('Falta el pedido')
    renderAt('/pedidos')
    const customer = await screen.findByRole('link', { name: order.customer.name })
    expect(customer.getAttribute('href')).toBe('/clientes/cus-seed-1')
    await user.click(customer)
    expect(await screen.findByRole('heading', { name: order.customer.name })).toBeTruthy()
    expect(screen.getByText(order.customer.email)).toBeTruthy()
    await user.click(await screen.findByRole('link', { name: order.reference }))
    expect(await screen.findByRole('heading', { name: order.reference })).toBeTruthy()
    expect((await screen.findByRole('link', { name: order.customer.name })).getAttribute('href')).toBe('/clientes/cus-seed-1')
  })

  it('does not link customers without a saved record', async () => {
    const orders = createSeedOrders().map((order) =>
      order.id === 'ord-seed-2' ? { ...order, customerId: 'missing-customer' } : order,
    )
    localStorage.setItem('galaxiaocio-demo:v1:orders', JSON.stringify(orders))
    renderAt('/pedidos')
    expect(await screen.findByText('Hotel Costa Brava SL')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Hotel Costa Brava SL' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Makro Alcobendas' })).toBeNull()
  })

  it('handles a missing customer page', async () => {
    renderAt('/clientes/missing-customer')
    expect(await screen.findByText('Cliente no encontrado')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Volver a clientes' }).getAttribute('href')).toBe('/clientes')
  })

  it('searches, filters and paginates customers', async () => {
    const seed = createSeedCustomers()[0]
    if (!seed) throw new Error('Falta el cliente')
    const customers = Array.from({ length: 21 }, (_, index) => ({
      ...seed,
      id: index === 0 ? seed.id : `customer-${index}`,
      name: `Cliente ${String(index + 1).padStart(2, '0')}`,
      taxId: `NIF-${index + 1}`,
    }))
    localStorage.setItem('galaxiaocio-demo:v1:customers', JSON.stringify(customers))
    const user = userEvent.setup()
    renderAt('/clientes')
    expect(await screen.findByText('1–10 de 21 clientes')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(screen.getByText('11–20 de 21 clientes')).toBeTruthy()
    await user.type(screen.getByLabelText('Buscar clientes'), 'NIF-21')
    expect(await screen.findByRole('link', { name: 'Cliente 21' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(await screen.findByText('1–10 de 21 clientes')).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: /Con pedidos/ }))
    expect(screen.getByRole('link', { name: 'Cliente 01' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Cliente 02' })).toBeNull()
    await user.click(screen.getByRole('tab', { name: /Sin pedidos/ }))
    expect(screen.queryByRole('link', { name: 'Cliente 01' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Cliente 02' })).toBeTruthy()
  })

  it('searches, filters and paginates a customer’s orders', async () => {
    const seed = createSeedOrders()[0]
    if (!seed) throw new Error('Falta el pedido')
    const orders = Array.from({ length: 21 }, (_, index) => ({
      ...seed,
      id: `customer-order-${index}`,
      reference: `PED-CLIENTE-${String(index + 1).padStart(2, '0')}`,
      stage: index === 20 ? 'shipped' : 'stored',
    }))
    localStorage.setItem('galaxiaocio-demo:v1:orders', JSON.stringify(orders))
    const user = userEvent.setup()
    renderAt('/clientes/cus-seed-1')
    expect(await screen.findByText('1–10 de 21 pedidos')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(screen.getByText('11–20 de 21 pedidos')).toBeTruthy()
    await user.type(screen.getByLabelText('Buscar pedidos del cliente'), 'PED-CLIENTE-21')
    expect(await screen.findByRole('link', { name: 'PED-CLIENTE-21' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(await screen.findByText('1–10 de 21 pedidos')).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: /Enviados/ }))
    expect(screen.getByRole('link', { name: 'PED-CLIENTE-21' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'PED-CLIENTE-01' })).toBeNull()
    await user.type(screen.getByLabelText('Buscar pedidos del cliente'), 'sin coincidencias')
    expect(screen.getByText(/No hay pedidos en esta vista/)).toBeTruthy()
  })

  it.each([
    ['/clientes', 'Restaurante El Rincón del Mar', '/clientes/cus-seed-1'],
    ['/resumen', 'Restaurante El Rincón del Mar', '/clientes/cus-seed-1'],
    ['/pedidos/ord-seed-6', 'Cafetería Aurora', '/clientes/cus-seed-6'],
  ])('links saved customers from %s', async (path, name, href) => {
    renderAt(path)
    const links = await screen.findAllByRole('link', { name })
    expect(links.every((link) => link.getAttribute('href') === href)).toBe(true)
  })

  it('finds orders by customer name, phone, email and reference', async () => {
    const user = userEvent.setup()
    renderAt('/pedidos')
    const search = await screen.findByLabelText('Buscar pedidos')
    await user.type(search, 'rincon')
    expect(await screen.findByText('Restaurante El Rincón del Mar')).toBeTruthy()
    expect(screen.queryByText('Hotel Costa Brava SL')).toBeNull()
    await user.clear(search)
    await user.type(search, '972000111')
    expect(await screen.findByText('Hotel Costa Brava SL')).toBeTruthy()
    await user.clear(search)
    await user.type(search, 'cocina@costabrava')
    expect(await screen.findByText('Hotel Costa Brava SL')).toBeTruthy()
    const row = screen.getByText('Hotel Costa Brava SL').closest('tr')
    if (!row) throw new Error('Falta el pedido')
    const reference = within(row).getByRole('link').textContent ?? ''
    await user.clear(search)
    await user.type(search, reference)
    expect(await screen.findByText('Hotel Costa Brava SL')).toBeTruthy()
  })

  it('paginates orders and resets the page when searching or filtering', async () => {
    const seed = createSeedOrders()[0]
    if (!seed) throw new Error('Falta el pedido de ejemplo')
    const orders = Array.from({ length: 21 }, (_, index) => ({
      ...seed,
      id: `pagination-${index}`,
      reference: `PED-PAG-${String(index + 1).padStart(2, '0')}`,
      customer: { ...seed.customer, name: `Cliente ${index + 1}` },
      stage: index === 20 ? 'incomplete' : 'stored',
    }))
    localStorage.setItem('galaxiaocio-demo:v1:orders', JSON.stringify(orders))
    const user = userEvent.setup()
    renderAt('/pedidos')
    expect(await screen.findByText('1–10 de 21 pedidos')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(screen.getByText('11–20 de 21 pedidos')).toBeTruthy()
    await user.type(screen.getByLabelText('Buscar pedidos'), 'PED-PAG-21')
    expect(await screen.findByText('PED-PAG-21')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(screen.getByText('1–10 de 21 pedidos')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    await user.click(screen.getByRole('tab', { name: /Requieren atención/ }))
    expect(await screen.findByText('PED-PAG-21')).toBeTruthy()
  })

  it('confirms deletion, keeps the local record and blocks prepared orders', async () => {
    const seed = createSeedOrders()
    const removable = seed[0]
    const protectedOrder = seed[5]
    if (!removable || !protectedOrder) throw new Error('Faltan pedidos de ejemplo')
    localStorage.setItem('galaxiaocio-demo:v1:orders', JSON.stringify(seed))
    const user = userEvent.setup()
    renderAt('/pedidos')
    const deleteButton = await screen.findByRole('button', { name: `Eliminar pedido ${removable.reference}` })
    expect(screen.getByRole('button', { name: `Eliminar pedido ${protectedOrder.reference}` }).hasAttribute('disabled')).toBe(true)
    await user.click(deleteButton)
    let dialog = await screen.findByRole('alertdialog', { name: `Eliminar ${removable.reference}` })
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('link', { name: removable.reference })).toBeTruthy()
    await user.click(deleteButton)
    dialog = await screen.findByRole('alertdialog', { name: `Eliminar ${removable.reference}` })
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar pedido' }))
    await waitFor(() => expect(screen.queryByRole('link', { name: removable.reference })).toBeNull())
    const saved = JSON.parse(localStorage.getItem('galaxiaocio-demo:v1:orders') ?? '[]') as Array<{ id: string; deletedAt?: string }>
    expect(saved.find((order) => order.id === removable.id)?.deletedAt).toBeTruthy()
    cleanup()
    queryClient.clear()
    renderAt(`/pedidos/${removable.id}`)
    expect(await screen.findByText('Pedido no encontrado')).toBeTruthy()
  })

  it('guides manual order entry and allows saving incomplete orders', async () => {
    const user = userEvent.setup()
    renderAt('/pedidos')
    await user.click(await screen.findByRole('button', { name: 'Nuevo pedido' }))

    expect(await screen.findByRole('dialog', { name: 'Nuevo pedido' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Formulario manual/ }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Nuevo pedido' })).toBeTruthy()
    expect(screen.getByPlaceholderText('Ej. Hotel Costa Brava SL')).toBeTruthy()
    expect(screen.getByPlaceholderText('Calle, número, piso o local')).toBeTruthy()
    expect(screen.getByText(/Indica al menos un email o un teléfono/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Añadir artículo' }))
    const removeButtons = screen.getAllByRole('button', { name: 'Quitar artículo' })
    expect(removeButtons).toHaveLength(2)
    const secondRemove = removeButtons[1]
    if (!secondRemove) throw new Error('Falta el segundo artículo')
    await user.click(secondRemove)
    expect(screen.getAllByRole('button', { name: 'Quitar artículo' })).toHaveLength(1)

    await user.type(screen.getByLabelText('Nombre o razón social'), 'Cliente nuevo')
    await user.click(screen.getByRole('button', { name: 'Registrar pedido' }))
    expect(await screen.findByText('Faltan datos para continuar')).toBeTruthy()
    expect(screen.getByDisplayValue('Cliente nuevo')).toBeTruthy()
  })

  it('returns from manual entry without creating an order', async () => {
    const user = userEvent.setup()
    renderAt('/pedidos')
    await user.click(await screen.findByRole('button', { name: 'Nuevo pedido' }))
    await user.click(screen.getByRole('button', { name: /Formulario manual/ }))
    await user.click(screen.getByRole('button', { name: 'Cambiar origen' }))
    expect(await screen.findByRole('dialog', { name: 'Nuevo pedido' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Formulario manual/ }))
    await user.type(screen.getByLabelText('Nombre o razón social'), 'Cliente sin guardar')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(await screen.findByRole('button', { name: 'Nuevo pedido' })).toBeTruthy()
    expect(screen.queryByText('Cliente sin guardar')).toBeNull()
  })

  it('simulates analysis of any text and retains the original text', async () => {
    const user = userEvent.setup()
    renderAt('/pedidos')
    await user.click(await screen.findByRole('button', { name: 'Nuevo pedido' }))
    await user.click(screen.getByRole('button', { name: /Desde un texto/ }))
    fireEvent.change(screen.getByLabelText('Texto del pedido'), { target: { value: 'Otro pedido cualquiera' } })
    await user.click(screen.getByRole('button', { name: 'Analizar texto' }))
    expect(screen.getByRole('status').textContent).toContain('Analizando el texto')
    expect(await screen.findByDisplayValue('406-2275987-2836318', {}, { timeout: 3000 })).toBeTruthy()
    expect(screen.getByDisplayValue('Antonio Rodríguez Martín')).toBeTruthy()
    expect(screen.getByDisplayValue('Q0-QM5K-G2HR')).toBeTruthy()
    expect(screen.getAllByDisplayValue('220,00').length).toBeGreaterThan(0)
    await user.clear(screen.getByLabelText('Dirección adicional'))
    await user.type(screen.getByLabelText('Dirección adicional'), 'Local 2')
    await user.click(screen.getByRole('button', { name: 'Registrar pedido' }))
    expect(await screen.findByText('Faltan datos para continuar')).toBeTruthy()
    expect(screen.getByDisplayValue('406-2275987-2836318')).toBeTruthy()
    expect(screen.getByDisplayValue('Local 2')).toBeTruthy()
    expect(screen.getByDisplayValue('Q0-QM5K-G2HR')).toBeTruthy()
    expect(screen.getAllByDisplayValue('220,00').length).toBeGreaterThan(0)
    await user.click(screen.getByText('Ver texto original'))
    expect(screen.getByText('Otro pedido cualquiera')).toBeTruthy()
  })

  it('makes clear that photo extraction uses fictional data and resets when cancelled', async () => {
    const user = userEvent.setup()
    renderAt('/pedidos')
    await user.click(await screen.findByRole('button', { name: 'Nuevo pedido' }))
    await user.click(screen.getByRole('button', { name: /Desde una foto/ }))
    await user.upload(screen.getByLabelText('Foto del pedido'), new File(['image'], 'pedido.png', { type: 'image/png' }))
    expect(screen.getByRole('status').textContent).toContain('Analizando la imagen')
    expect(await screen.findByText(/la imagen no se ha analizado/i, {}, { timeout: 3000 })).toBeTruthy()
    expect(screen.getByDisplayValue('Antonio Rodríguez Martín')).toBeTruthy()
    expect(screen.getByDisplayValue('406-2275987-2836318')).toBeTruthy()
    expect(screen.getByDisplayValue('Q0-QM5K-G2HR')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Nuevo pedido' }))
    await user.click(screen.getByRole('button', { name: /Formulario manual/ }))
    expect(screen.queryByDisplayValue('Antonio Rodríguez Martín')).toBeNull()
  })

  it('does not let a WhatsApp photo be registered before it is reviewed', async () => {
    const user = userEvent.setup()
    renderAt('/pedidos/ord-seed-3')
    expect(await screen.findByText('Contenido de ejemplo del pedido')).toBeTruthy()
    expect(screen.queryByText(/Lectura automática simulada/)).toBeNull()
    const confirm = screen.getByRole('button', { name: /Confirmar revisión y registrar/ })
    expect(
      confirm.hasAttribute('disabled') || confirm.getAttribute('aria-disabled') === 'true',
    ).toBe(true)
    await user.click(screen.getByRole('checkbox', { name: /He comparado los datos con la foto/ }))
    await waitFor(() =>
      expect(
        confirm.hasAttribute('disabled') || confirm.getAttribute('aria-disabled') === 'true',
      ).toBe(false),
    )
  })

  it('replaces validated order data with stock and allows revisiting it', async () => {
    const user = userEvent.setup()
    renderAt('/pedidos/ord-seed-2')
    await user.type(await screen.findByLabelText('Código postal'), '17310')
    await user.click(screen.getByRole('button', { name: 'Guardar y validar' }))
    expect(await screen.findByRole('button', { name: /Preparar expedición/ })).toBeTruthy()
    expect(screen.queryByText('Prepara la expedición')).toBeNull()
    expect(screen.queryByText(/Hay stock suficiente: reserva los artículos/)).toBeNull()
    expect(screen.queryByLabelText('Código postal')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Ver datos del pedido' }))
    expect(screen.getByDisplayValue('17310')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Guardar y validar' }))
    await waitFor(() => expect(screen.queryByLabelText('Código postal')).toBeNull())
  })

  it('marks only the current sidebar item as active so the others can show hover', async () => {
    renderAt('/stock')
    const stock = await screen.findByRole('button', { name: 'Stock' })
    expect(screen.queryByText('Operativa')).toBeNull()
    expect(stock.getAttribute('data-active')).toBe('true')
    // An inactive item must not carry the attribute at all: Tailwind's `data-active:` matches presence.
    for (const name of ['Pedidos', 'Clientes', 'Agencias y tarifas', 'Restablecer datos']) {
      expect(screen.getByRole('button', { name }).hasAttribute('data-active')).toBe(false)
    }
    expect(screen.queryByText('Galaxiaocio')).toBeTruthy()
  })

  it('lets the team edit a tariff formula and uses it right away', async () => {
    const user = userEvent.setup()
    renderAt('/transporte')

    await user.click(await screen.findByRole('button', { name: 'Editar MRW España peninsular' }))
    const formula = await screen.findByLabelText('Fórmula del precio (€)')
    await user.clear(formula)
    await user.type(formula, '1 + 0,01 * kg')
    expect(await screen.findByText(/Ejemplo: 10 kg → 1,10 €/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(screen.queryByLabelText('Fórmula del precio (€)')).toBeNull())
    // It appears in the tariff table and, being now the cheapest, in the price simulator too.
    await waitFor(() => expect(screen.getAllByText('1 + 0,01 * kg')).toHaveLength(2))
  })

  it('shows only configured agencies without an account distinction', async () => {
    const user = userEvent.setup()
    renderAt('/transporte')
    const weight = await screen.findByLabelText('Peso del envío (kg)')
    await user.clear(weight)
    await user.type(weight, '60')
    expect(await screen.findByText('Recomendada')).toBeTruthy()
    expect(screen.queryByText('Sin cuenta')).toBeNull()
    expect(screen.queryByText('Con cuenta')).toBeNull()
    expect(screen.queryByText(/Redur/i)).toBeNull()
    const stored = JSON.parse(
      localStorage.getItem('galaxiaocio-demo:v1:carriers') ?? '[]',
    ) as Array<{ id: string }>
    expect(stored.some((carrier) => carrier.id === 'redur')).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Nueva agencia' }))
    expect(screen.queryByRole('checkbox', { name: /cuenta/i })).toBeNull()
  })

  it('refuses a formula with a mistake and explains it', async () => {
    const user = userEvent.setup()
    renderAt('/transporte')

    await user.click(await screen.findByRole('button', { name: 'Editar MRW España peninsular' }))
    const formula = await screen.findByLabelText('Fórmula del precio (€)')
    await user.clear(formula)
    await user.type(formula, '5 + peso')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText(/«peso» no existe/)).toBeTruthy()
    expect(screen.getByLabelText('Fórmula del precio (€)')).toBeTruthy()
  })

  it('keeps accounting pending when delivery is confirmed first', async () => {
    const orders = createSeedOrders().map((order) =>
      order.id === 'ord-seed-6' ? { ...order, stage: 'shipped' } : order,
    )
    localStorage.setItem('galaxiaocio-demo:v1:orders', JSON.stringify(orders))
    const user = userEvent.setup()
    renderAt('/pedidos/ord-seed-6')
    await user.click(await screen.findByRole('button', { name: 'Marcar como recibido' }))
    expect(await screen.findByText(/Recibido ·/)).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: 'Documentos' }))
    await user.click(screen.getByRole('button', { name: 'Preparar para el gestor' }))
    expect(screen.getByText('Preparado para el gestor')).toBeTruthy()
    expect(screen.getByText(/Pedido recibido/)).toBeTruthy()
  })

  it('shows a sent order as a complete record and persists its incidents and communications', async () => {
    const user = userEvent.setup()
    renderAt('/pedidos/ord-seed-6')
    expect((await screen.findAllByText('Cafetería Aurora')).length).toBeGreaterThan(0)
    expect(screen.getByText('C/ Ercilla 12')).toBeTruthy()
    expect(screen.getByText('Cubeta GN 1/1 inox (pack 6)')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Ver datos del pedido' })).toBeNull()
    expect(screen.queryByLabelText('Código postal')).toBeNull()
    await user.click(screen.getByRole('tab', { name: 'Incidencias' }))
    await user.type(screen.getByLabelText('Nueva incidencia'), 'El paquete llegó dañado')
    await user.click(screen.getByRole('button', { name: 'Crear incidencia' }))
    expect(await screen.findByText('El paquete llegó dañado')).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: 'Comunicaciones' }))
    await user.type(screen.getByLabelText('Nueva comunicación'), 'Llamada: cliente solicita seguimiento')
    await user.click(screen.getByRole('button', { name: 'Guardar comunicación' }))
    expect(await screen.findByText('Llamada: cliente solicita seguimiento')).toBeTruthy()
    cleanup()
    queryClient.clear()
    renderAt('/pedidos/ord-seed-6')
    await user.click(await screen.findByRole('tab', { name: 'Incidencias' }))
    expect(await screen.findByText('El paquete llegó dañado')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Marcar como resuelta' }))
    expect(await screen.findByText('Resuelta')).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: 'Comunicaciones' }))
    expect(await screen.findByText('Llamada: cliente solicita seguimiento')).toBeTruthy()
    await user.click(screen.getByRole('tab', { name: 'Histórico' }))
    expect(await screen.findByText('Incidencia resuelta')).toBeTruthy()
    expect(within(screen.getByRole('tabpanel')).getByText('Comunicación registrada')).toBeTruthy()
  })

  it('takes an order from stock to shipping and the accountant', async () => {
    const user = userEvent.setup()
    renderAt('/pedidos/ord-seed-1')

    await user.click(await screen.findByRole('button', { name: 'Ver datos del pedido' }))
    await user.type(await screen.findByLabelText('Dirección adicional'), 'Piso 3')
    await user.type(screen.getByLabelText('Provincia'), 'Madrid')
    await user.click(screen.getByRole('button', { name: 'Guardar y validar' }))
    await waitFor(() => expect(screen.queryByLabelText('Dirección adicional')).toBeNull())
    await user.click(await screen.findByRole('button', { name: /Preparar expedición/ }))
    expect(await screen.findByText('Recomendada')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Preparar expedición/ })).toBeNull()
    expect(screen.queryByLabelText('Dirección adicional')).toBeNull()

    // Accepting the recommended carrier opens its website and copies the shipment data.
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    expect(screen.queryByLabelText('Nº de seguimiento')).toBeNull()
    await user.click(screen.getByRole('button', { name: /Aceptar y abrir/ }))
    expect(open).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\//),
      '_blank',
      expect.any(String),
    )
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Destinatario:')),
    )
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Dirección adicional: Piso 3'))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Provincia: Madrid'))

    await user.type(await screen.findByLabelText('Nº de seguimiento'), 'TRK-123')
    await user.click(screen.getByRole('button', { name: /Marcar como enviado/ }))
    expect(await screen.findByText(/Pedido enviado ·/)).toBeTruthy()
    expect(screen.queryByLabelText('Nº de seguimiento')).toBeNull()
    await user.click(screen.getByText('Ver datos del envío'))
    expect(await screen.findByText('Envío registrado')).toBeTruthy()

    // Delivery note and invoice appear on their own: there is no "generate" step any more.
    await user.click(screen.getByRole('tab', { name: 'Documentos' }))
    expect(await screen.findByRole('button', { name: /Preparar para el gestor/ })).toBeTruthy()
    expect(await screen.findByText(/ALB-\d{4}-\d{4}/)).toBeTruthy()
    expect(screen.getByText(/FAC-\d{4}-\d{4}/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Generar documentos/ })).toBeNull()

    await user.click(screen.getByRole('button', { name: /Preparar para el gestor/ }))
    expect(await screen.findByText(/Pedido enviado ·/)).toBeTruthy()
    expect(screen.queryByText('Cerrado')).toBeNull()
    await user.click(screen.getByRole('tab', { name: 'Resumen' }))
    const trackingLink = screen.getByRole('link', { name: /Consultar pedido en/ })
    expect(trackingLink.getAttribute('href')).toMatch(/^https:\/\//)
    expect(screen.getAllByText(/TRK-123/).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Marcar como recibido' }))
    expect(await screen.findByText(/Pedido recibido ·/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Marcar como recibido' })).toBeNull()

    cleanup()
    queryClient.clear()
    renderAt('/pedidos')
    await user.type(await screen.findByLabelText('Buscar pedidos'), 'TRK-123')
    const row = (await screen.findByText('Restaurante El Rincón del Mar')).closest('tr')
    if (!row) throw new Error('Falta el pedido enviado')
    expect(within(row).getByText('Recibido')).toBeTruthy()
    await user.click(within(row).getByRole('link', { name: /^PED-/ }))
    expect(await screen.findByText(/Pedido recibido ·/)).toBeTruthy()
    expect(screen.getByText(/612345678/)).toBeTruthy()
  })
})
