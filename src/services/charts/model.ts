/** A chart as the layout store keeps it: its id and whether it's shown, at least. */
export interface ChartEntry {
  id: string;
  enabled: boolean;
}

/**
 * Fluidd keeps the charts in up to four columns (container1 to container4);
 * Charts lists them in one order, the columns read in turn.
 */
export function flattenCharts<T extends ChartEntry> (layout: Record<string, T[]> | undefined): T[] {
  return Object.keys(layout ?? {})
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .flatMap(key => layout?.[key] ?? [])
}

/** The charts in one order, as the layout store takes them: all in the first column, the others empty. */
export function layoutFrom<T extends ChartEntry> (charts: T[]): Record<string, T[]> {
  return { container1: charts, container2: [], container3: [], container4: [] }
}

/** A chart moved `by` places (-1 earlier, 1 later); unchanged at either end. */
export function moveChart<T extends ChartEntry> (charts: T[], id: string, by: number): T[] {
  const from = charts.findIndex(c => c.id === id)
  const to = from + by
  if (from < 0 || to < 0 || to >= charts.length) return charts
  const next = [...charts]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** A metric's latest value from the chart store, keyed by its collector. */
export function metricValue (points: Array<Record<string, unknown>> | undefined, collector: string): number | null {
  for (let i = (points?.length ?? 0) - 1; i >= 0; i--) {
    const value = points![i][collector]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value !== '' && Number.isFinite(Number(value))) return Number(value)
  }
  return null
}

/** "12.346 mm/s", "—", to three places as Fluidd's tooltip shows them. */
export function formatMetric (value: number | null, unit: string): string {
  if (value === null) return '—'
  const rounded = Math.round(value * 1000) / 1000
  return unit ? `${rounded} ${unit}` : String(rounded)
}
