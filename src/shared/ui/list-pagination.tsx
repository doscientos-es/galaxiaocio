import { Pagination } from '@doscientos/ui'
import { useState } from 'react'

export function useListPagination<T>(items: T[], resetKey: string, pageSize = 10) {
  const [state, setState] = useState({ key: resetKey, page: 1 })
  if (state.key !== resetKey) setState({ key: resetKey, page: 1 })
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(state.key === resetKey ? state.page : 1, pageCount)
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page, pageCount, start, pageSize, total: items.length,
    setPage: (next: number) => setState({ key: resetKey, page: next }),
  }
}

export function ListPagination({ controller, singular, plural }: {
  controller: ReturnType<typeof useListPagination>
  singular: string
  plural: string
}) {
  const { page, pageCount, start, pageSize, total, setPage } = controller
  if (!total) return null
  const noun = total === 1 ? singular : plural
  if (pageCount === 1) return <p className="text-muted-foreground text-sm">{total} {noun}</p>
  return <Pagination page={page} pageCount={pageCount} onPageChange={setPage} ariaLabel={`Páginas de ${plural}`} summary={`${start + 1}–${Math.min(start + pageSize, total)} de ${total} ${noun}`} />
}