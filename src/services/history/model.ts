import type { TileTone } from '@/services/printers-page/model'

export type HistoryKind = 'finished' | 'stopped' | 'failed' | 'printing' | 'other'

export interface HistoryStatus {
  kind: HistoryKind;
  text: string;
  tone: TileTone;
}

/**
 * How a print ended, for people. A stopped print says how far it got, by
 * the filament it used of what the slicer planned.
 */
export function historyStatus (status: string, filamentUsed?: number, filamentTotal?: number): HistoryStatus {
  switch (status) {
    case 'completed': return { kind: 'finished', text: 'Finished', tone: 'ok' }
    case 'in_progress':
    case 'printing': return { kind: 'printing', text: 'Printing', tone: 'run' }
    case 'cancelled': {
      const part = filamentUsed && filamentTotal ? Math.min(100, Math.round(filamentUsed / filamentTotal * 100)) : null
      return { kind: 'stopped', text: part !== null ? `Stopped at ${part}%` : 'Stopped', tone: 'err' }
    }
    case 'klippy_shutdown':
    case 'klippy_disconnect':
    case 'server_exit':
    case 'interrupted':
    case 'error': return { kind: 'failed', text: 'Failed', tone: 'err' }
    default: return { kind: 'other', text: status, tone: 'off' }
  }
}

export type HistoryFilter = 'all' | 'finished' | 'stopped' | 'failed'

export function filterHistory<T extends { filename: string, status: string }> (items: T[], filter: HistoryFilter, query: string): T[] {
  const q = query.trim().toLowerCase()
  return items.filter(item => {
    if (filter !== 'all' && historyStatus(item.status).kind !== filter) return false
    return !q || item.filename.toLowerCase().includes(q)
  })
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Today", "Yesterday", "Sat 10 Oct", or "Sat 10 Oct 2025" from another year. */
export function dayLabel (seconds: number, now: Date = new Date()): string {
  const d = new Date(seconds * 1000)
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((start(now) - start(d)) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  const label = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
  return d.getFullYear() === now.getFullYear() ? label : `${label} ${d.getFullYear()}`
}

/** The prints by the day they started, newest first, each day's in the order given. */
export function groupByDay<T extends { start_time: number }> (items: T[], now: Date = new Date()): Array<{ label: string, items: T[] }> {
  const groups: Array<{ label: string, items: T[] }> = []
  for (const item of [...items].sort((a, b) => b.start_time - a.start_time)) {
    const label = dayLabel(item.start_time, now)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
}

/** Filament in metres, for people: "12.4 m", "0.85 m", "1,240 m". */
export function metres (mm: number): string {
  const m = mm / 1000
  if (m >= 100) return `${Math.round(m).toLocaleString('en-GB')} m`
  if (m >= 10) return `${m.toFixed(1)} m`
  return `${m.toFixed(2)} m`
}

/** How many of the prints loaded finished, as "41 of the last 50 finished". */
export function finishedShare (items: Array<{ status: string }>): string {
  const done = items.filter(i => historyStatus(i.status).kind === 'finished').length
  return `${done} of the last ${items.length} finished`
}

/**
 * The slicer's facts worth showing for a print, in order, from its
 * metadata: what people check when a print went wrong.
 */
export function slicerFacts (meta: Record<string, unknown> | undefined): Array<{ label: string, value: string }> {
  if (!meta) return []
  const facts: Array<{ label: string, value: string }> = []
  const num = (key: string) => (typeof meta[key] === 'number' ? meta[key] as number : null)
  const add = (label: string, value: string | null) => { if (value) facts.push({ label, value }) }
  add('Slicer', [meta.slicer, meta.slicer_version].filter(Boolean).join(' ') || null)
  add('Material', typeof meta.filament_type === 'string' ? meta.filament_type.split(';')[0] : null)
  add('Layer height', num('layer_height') !== null ? `${num('layer_height')} mm` : null)
  add('Nozzle', num('first_layer_extr_temp') !== null ? `${num('first_layer_extr_temp')}° first layer` : null)
  add('Bed', num('first_layer_bed_temp') !== null ? `${num('first_layer_bed_temp')}° first layer` : null)
  add('Height', num('object_height') !== null ? `${num('object_height')} mm` : null)
  add('Planned filament', num('filament_weight_total') !== null ? `${Math.round(num('filament_weight_total')!)} g` : null)
  return facts
}
