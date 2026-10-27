import {
  Button,
  DataViewState,
  DataViewStateActions,
  DataViewStateDescription,
  DataViewStateTitle,
} from '@doscientos/ui'
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

import { AppFrame } from '@/app/app-frame'

export const Route = createRootRoute({
  component: () => (
    <AppFrame>
      <Outlet />
    </AppFrame>
  ),
  errorComponent: ({ reset }) => (
    <DataViewState aria-live="polite">
      <DataViewStateTitle>No se ha podido cargar esta pantalla</DataViewStateTitle>
      <DataViewStateDescription>
        Reintenta la operación o vuelve al resumen.
      </DataViewStateDescription>
      <DataViewStateActions>
        <Button onPress={reset}>Reintentar</Button>
        <Link to="/resumen" className="text-sm underline">
          Volver al resumen
        </Link>
      </DataViewStateActions>
    </DataViewState>
  ),
  notFoundComponent: () => (
    <DataViewState>
      <DataViewStateTitle>Página no encontrada</DataViewStateTitle>
      <DataViewStateDescription>La ruta solicitada no existe.</DataViewStateDescription>
      <DataViewStateActions>
        <Link to="/resumen" className="text-sm underline">
          Volver al resumen
        </Link>
      </DataViewStateActions>
    </DataViewState>
  ),
})
