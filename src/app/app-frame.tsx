import {
  ConfirmDialog,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  toast,
} from '@doscientos/ui'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import {
  FileText,
  LayoutDashboard,
  type LucideIcon,
  Package,
  RotateCcw,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { useOrders } from '@/features/orders'

import { queryClient } from './providers'
import { resetDemoData } from './repositories'

/**
 * `SidebarMenuButton` renders `data-active="false"` on inactive items, and Tailwind's
 * `data-active:` variant matches the mere presence of the attribute, so every item looked active
 * and hover was invisible. Only active items get the attribute here.
 */
const activeAttribute = (active: boolean) => ({ 'data-active': active ? 'true' : undefined })

/**
 * Visible states for every sidebar item: a clear hover, a tinted active item and smooth
 * transitions.
 */
const navItemClass = [
  'h-9 rounded-lg px-3 transition-colors duration-150',
  'hover:bg-foreground/[0.07] hover:text-foreground',
  'active:bg-foreground/[0.12]',
  'data-active:bg-primary/10 data-active:text-primary data-active:hover:bg-primary/15',
  '[&_svg]:text-muted-foreground [&_svg]:transition-colors',
  'hover:[&_svg]:text-foreground data-active:[&_svg]:text-primary',
].join(' ')

type NavigationPath =
  | '/resumen'
  | '/pedidos'
  | '/clientes'
  | '/stock'
  | '/transporte'
  | '/administracion'

const navigation: Array<{ to: NavigationPath; label: string; icon: LucideIcon }> = [
  { to: '/resumen', label: 'Resumen', icon: LayoutDashboard },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/stock', label: 'Stock', icon: Package },
  { to: '/transporte', label: 'Transporte', icon: Truck },
  { to: '/administracion', label: 'Administración', icon: FileText },
]

export function AppFrame({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { orders } = useOrders()
  const [confirmingReset, setConfirmingReset] = useState(false)
  const attention = orders.filter(
    (order) => order.stage === 'review' || order.stage === 'incomplete',
  ).length

  async function reset() {
    await resetDemoData()
    await queryClient.invalidateQueries()
    setConfirmingReset(false)
    await navigate({ to: '/resumen' })
    toast.success('Demo restablecida')
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader className="gap-0.5 px-4 pt-4 pb-2">
          <p className="text-base leading-tight font-semibold tracking-tight">Galaxiaocio</p>
          <p className="text-muted-foreground text-xs">Gestión de pedidos</p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Operativa</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map(({ to, label, icon: Icon }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      className={navItemClass}
                      tooltip={label}
                      isActive={pathname.startsWith(to)}
                      {...activeAttribute(pathname.startsWith(to))}
                      onPress={() => void navigate({ to })}
                    >
                      <Icon aria-hidden />
                      {label}
                    </SidebarMenuButton>
                    {to === '/pedidos' && attention > 0 ? (
                      <SidebarMenuBadge>{attention}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className={navItemClass}
                {...activeAttribute(false)}
                onPress={() => setConfirmingReset(true)}
              >
                <RotateCcw aria-hidden />
                Restablecer demo
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="border-border flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-muted-foreground text-sm">Demo con datos de ejemplo</span>
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </SidebarInset>
      <ConfirmDialog
        open={confirmingReset}
        onOpenChange={setConfirmingReset}
        title="Restablecer la demo"
        description="Se borrarán los cambios y volverán los pedidos, stock y envíos de ejemplo."
        confirmLabel="Restablecer"
        onConfirm={() => void reset()}
      />
    </SidebarProvider>
  )
}
