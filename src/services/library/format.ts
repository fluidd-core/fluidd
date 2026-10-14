/**
 * How the Library's prints read: what each G-code was sliced for
 * ("M1 · 0.4 · PLA"), how long and how much, and where it last printed.
 */
import { shortDuration } from '@/util/short-duration'
import type { ItemSetup, LibraryItem, PrintSetup, Version } from './api'

/** The model's short name: "Muon3D M1" is the M1. */
export function shortModel (model: string): string {
  return model.replace(/^\s*muon\s*3d\s+/i, '').trim() || model
}

export function nozzleText (mm: number): string {
  return String(Number(mm.toFixed(2)))
}

/** "M1", "0.4", "PLA". */
export function setupChips (setup: PrintSetup): string[] {
  return [shortModel(setup.printer_model), nozzleText(setup.nozzle_mm), setup.material]
}

/** "M1 · 0.4 · PLA". */
export function setupLine (setup: PrintSetup): string {
  return setupChips(setup).join(' · ')
}

/** "1h 12m · 23 g", or as much of it as the slicer said. */
export function printFacts (setup: Pick<ItemSetup, 'print_seconds' | 'filament_g'> | undefined): string {
  if (!setup) return ''
  const facts: string[] = []
  if (typeof setup.print_seconds === 'number' && setup.print_seconds > 0) facts.push(shortDuration(setup.print_seconds))
  if (typeof setup.filament_g === 'number' && setup.filament_g > 0) facts.push(`${Math.round(setup.filament_g)} g`)
  return facts.join(' · ')
}

/** "Printed 3× · Boxwood", or "Not printed yet". */
export function printedLine (item: Pick<LibraryItem, 'printed_count' | 'last_printer_name'>): string {
  const count = item.printed_count ?? 0
  if (count < 1) return 'Not printed yet'
  const times = count === 1 ? 'Printed once' : `Printed ${count}×`
  return item.last_printer_name ? `${times} · ${item.last_printer_name}` : times
}

/** "820 KB", "120 MB", "1.5 GB". */
export function bytesText (bytes: number): string {
  if (bytes < 1000) return `${bytes} B`
  if (bytes < 1e6) return `${Math.round(bytes / 1e3)} KB`
  if (bytes < 1e9) return `${bytes < 1e7 ? (bytes / 1e6).toFixed(1) : Math.round(bytes / 1e6)} MB`
  return `${(bytes / 1e9).toFixed(1).replace(/\.0$/, '')} GB`
}

/** "120 MB of 2 GB used". */
export function storageLine (used: number | null, quota: number | null): string {
  if (used === null) return ''
  return quota ? `${bytesText(used)} of ${bytesText(quota)} used` : `${bytesText(used)} used`
}

/** "11 November", for a date the Library gives. */
export function dayText (iso: string | null): string {
  if (!iso) return ''
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  return at.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}

export type PrintSort = 'recent' | 'name'

/** The prints whose names hold every word searched for, newest change first or by name. */
export function findPrints<T extends Pick<LibraryItem, 'name' | 'updated_at'>> (prints: T[], query: string, sort: PrintSort): T[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const found = prints.filter(p => words.every(w => p.name.toLowerCase().includes(w)))
  return sort === 'name'
    ? [...found].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }))
    : [...found].sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

/** "6 prints · 55 KB of 2 GB used". */
export function librarySummary (count: number, used: number | null, quota: number | null): string {
  const parts = [count === 1 ? '1 print' : `${count} prints`]
  const storage = storageLine(used, quota)
  if (storage) parts.push(storage)
  return parts.join(' · ')
}

/** "PLA · 1h 12m · 24 g" for a print (its first G-code), "STL · 4.2 MB" for a model. */
export function cardFacts (item: Pick<LibraryItem, 'versioned' | 'setups' | 'format' | 'size_bytes'>): string {
  const setup = item.setups?.[0]
  if (setup) return [setup.material, printFacts(setup)].filter(Boolean).join(' · ')
  if (item.versioned) return ''
  return [item.format.toUpperCase(), item.size_bytes ? bytesText(item.size_bytes) : ''].filter(Boolean).join(' · ')
}

/** "just now", "12 min ago", "2 h ago", "yesterday", "3 days ago", or the day. */
export function agoText (iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return ''
  const at = Date.parse(iso)
  if (!Number.isFinite(at)) return ''
  const minutes = Math.max(0, Math.round((now - at) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days < 2) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return dayText(iso)
}

/** What happened to a print last: "Printed on Walnut · yesterday", or "Saved from Slice · 2 h ago". */
export function lastEvent (item: Pick<LibraryItem, 'last_printed_at' | 'last_printer_name' | 'updated_at'>, now: number = Date.now()): { text: string, printed: boolean } {
  const printedAt = item.last_printed_at ? Date.parse(item.last_printed_at) : NaN
  const changedAt = Date.parse(item.updated_at)
  // A printed event moves updated_at too: within a minute of it, the print is what happened.
  if (Number.isFinite(printedAt) && (!Number.isFinite(changedAt) || changedAt - printedAt < 60_000)) {
    return { text: `Printed${item.last_printer_name ? ` on ${item.last_printer_name}` : ''} · ${agoText(item.last_printed_at, now)}`, printed: true }
  }
  return { text: `Saved from Slice · ${agoText(item.updated_at, now)}`, printed: false }
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** When a version was saved: "Today 14:02", "Yesterday 21:40", "Tue 9 Oct". */
export function versionWhen (iso: string, now: Date = new Date()): string {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  const time = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((day(now) - day(at)) / 86_400_000)
  if (days === 0) return `Today ${time}`
  if (days === 1) return `Yesterday ${time}`
  return `${WEEKDAYS[at.getDay()]} ${at.getDate()} ${MONTHS[at.getMonth()]}`
}

/** What a version was sliced with: "0.20 mm · Strong · supports off · PETG", from its summary and its G-code. */
export function versionLine (version: Pick<Version, 'summary' | 'files'>): string {
  const summary = (version.summary ?? {}) as Record<string, unknown>
  const parts: string[] = []
  if (typeof summary.layer_height_mm === 'number') parts.push(`${summary.layer_height_mm.toFixed(2)} mm`)
  for (const key of ['quality', 'strength']) {
    if (typeof summary[key] === 'string' && summary[key]) parts.push(summary[key] as string)
  }
  if (typeof summary.supports === 'boolean') parts.push(summary.supports ? 'supports on' : 'supports off')
  const materials = [...new Set(version.files.filter(f => f.role === 'gcode' && f.setup).map(f => f.setup!.material))]
  parts.push(...materials)
  return parts.join(' · ')
}

/** Where a version came from. */
export function versionOrigin (origin: string): string {
  switch (origin) {
    case 'autosave': return 'Saved automatically'
    case 'card':
    case 'save': return 'Saved from Slice'
    case 'print-check': return 'Saved when printed'
    case 'restore': return 'Restored'
    case 'copy': return 'Copied'
    default: return 'Saved'
  }
}
