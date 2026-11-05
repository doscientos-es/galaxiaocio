const normalise = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function matchesSearch(query: string, values: string[]): boolean {
  const search = normalise(query.trim())
  return !search || values.some((value) => normalise(value).includes(search))
}