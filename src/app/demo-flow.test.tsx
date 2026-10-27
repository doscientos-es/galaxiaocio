import { createMemoryHistory, RouterProvider, createRouter } from '@tanstack/react-router'
// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { routeTree } from '@/routeTree.gen'

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
    observe() {}
    unobserve() {}
    disconnect() {}
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
  it('lists the seeded orders from every channel', async () => {
    renderAt('/pedidos')
    expect(await screen.findByText('Makro Alcobendas')).toBeTruthy()
    expect(screen.getByText('Hotel Costa Brava SL')).toBeTruthy()
    expect(screen.getAllByText('Datos incompletos').length).toBeGreaterThan(0)
  })

  it('does not let a WhatsApp photo be registered before it is reviewed', async () => {
    const user = userEvent.setup()
    renderAt('/pedidos/ord-seed-3')
    expect(await screen.findByText('Foto recibida por WhatsApp')).toBeTruthy()
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

  it('marks only the current sidebar item as active so the others can show hover', async () => {
    renderAt('/stock')
    const stock = await screen.findByRole('button', { name: 'Stock' })
    expect(stock.getAttribute('data-active')).toBe('true')
    // An inactive item must not carry the attribute at all: Tailwind's `data-active:` matches presence.
    for (const name of ['Pedidos', 'Clientes', 'Transporte', 'Restablecer demo']) {
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

  it('takes an order from stock to shipping and the accountant', async () => {
    const user = userEvent.setup()
    renderAt('/pedidos/ord-seed-1')

    await user.click(await screen.findByRole('button', { name: /Preparar expedición/ }))
    expect(await screen.findByText('Recomendada')).toBeTruthy()

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

    await user.type(await screen.findByLabelText('Nº de seguimiento'), 'TRK-123')
    await user.click(screen.getByRole('button', { name: /Marcar como enviado/ }))
    expect(await screen.findByText('Envío registrado')).toBeTruthy()

    // Delivery note and invoice appear on their own: there is no "generate" step any more.
    expect(await screen.findByText(/ALB-\d{4}-\d{4}/)).toBeTruthy()
    expect(screen.getByText(/FAC-\d{4}-\d{4}/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Generar documentos/ })).toBeNull()

    await user.click(screen.getByRole('button', { name: /Preparar para el gestor/ }))
    expect(await screen.findByText('Pedido completado')).toBeTruthy()
  })
})
