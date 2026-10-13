/** Status words used by Control and by nearby printers, without a printer-store dependency. */
export function printerStatusWord (state: string | null): string {
  if (state === null) return 'Status unavailable'
  if (state === 'locked') return 'Needs access'
  return state.replace(/_/g, ' ').split(' ').filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
}
