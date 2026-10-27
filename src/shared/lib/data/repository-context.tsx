import { createContext, use, type ReactNode } from 'react'

/**
 * Creates a Provider/hook pair that injects a repository into a feature.
 * The composition root decides which implementation (localStorage, API…) is used.
 */
export function createRepositoryContext<Repository>(name: string) {
  const Context = createContext<Repository | null>(null)

  function RepositoryProvider({
    repository,
    children,
  }: {
    repository: Repository
    children: ReactNode
  }) {
    return <Context value={repository}>{children}</Context>
  }

  function useRepository(): Repository {
    const repository = use(Context)
    if (!repository) throw new Error(`Falta el proveedor de ${name}.`)
    return repository
  }

  return [RepositoryProvider, useRepository] as const
}
