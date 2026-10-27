export type CsvCell = string | number | null | undefined

const escapeCell = (cell: CsvCell): string => {
  const text = cell === null || cell === undefined ? '' : String(cell)
  return /[";\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

/** Builds a semicolon-separated CSV, the default list separator of Spanish spreadsheets. */
export function toCsv(header: string[], rows: CsvCell[][]): string {
  return [header, ...rows].map((row) => row.map(escapeCell).join(';')).join('\r\n')
}

/** Downloads text as a file. The BOM keeps accents readable when opened in Excel. */
export function downloadTextFile(fileName: string, content: string): void {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
