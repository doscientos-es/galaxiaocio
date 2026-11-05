import { Button, Input, Tabs, TabsList, TabsTrigger } from '@doscientos/ui'
import { Search } from 'lucide-react'

export function ListControls<T extends string>({
  query, onQueryChange, searchLabel, placeholder, filters, selected, onFilterChange, filterLabel,
}: {
  query: string
  onQueryChange: (query: string) => void
  searchLabel: string
  placeholder: string
  filters: { id: T; label: string; count: number }[]
  selected: T
  onFilterChange: (filter: T) => void
  filterLabel: string
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <div className="flex min-w-0 flex-1 basis-64 gap-2">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input className="pl-9" aria-label={searchLabel} placeholder={placeholder} value={query} onChange={(event) => onQueryChange(event.target.value)} />
        </div>
        {query ? <Button variant="outline" onPress={() => onQueryChange('')}>Limpiar</Button> : null}
      </div>
      <Tabs className="max-w-full flex-none overflow-x-auto" selectedKey={selected} onSelectionChange={(key) => {
        const option = filters.find((item) => item.id === key)
        if (option) onFilterChange(option.id)
      }}>
        <TabsList aria-label={filterLabel}>
          {filters.map((item) => (
            <TabsTrigger key={item.id} id={item.id} className="whitespace-nowrap">
              {item.label} <span className="text-muted-foreground tabular-nums">{item.count}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}