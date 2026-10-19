import type { KlipperFileMeta } from '@/store/files/types.metadata'
import { shortDuration } from '@/util/short-duration'

/** Every G-code file the gcodes root accepts (files/getRootProperties), and Prusa's binary G-code. */
const GCODE = /\.(gcode|g|gc|gco|ufp|nc|bgcode)$/i
/** What the slicer adds after the part's name: layer height, material, printer, time. */
const SLICER_TAIL = /[_\s-]+\d+(?:\.\d+)?mm(?:[_\s-].*)?$/i

/**
 * A job's name for people, from its file: octopus_brain_keychain+8_0.2mm_
 * PLA_Muon3D M1_53m9s.gcode is "Octopus brain keychain ×8". The file's own
 * name stays in the detail, under the title.
 */
export function jobTitle (filename: string): string {
  const base = (filename.split('/').pop() ?? filename).replace(GCODE, '')
  const name = base.replace(SLICER_TAIL, '') || base
  const words = name
    .replace(/\+(\d+)$/, ' ×$1')
    .replace(/[_]+/g, ' ')
    .replace(/\s-+\s/g, ' ')
    .replace(/(\S)-(\S)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** "53 min · 26 g PLA", from what the slicer wrote in the file. */
export function jobFacts (meta: Partial<KlipperFileMeta> | undefined): string {
  if (!meta) return ''
  const facts: string[] = []
  if (meta.estimated_time) facts.push(shortDuration(meta.estimated_time).replace(/m$/, ' min').replace(/h (\d+)m$/, 'h $1m'))
  if (meta.filament_weight_total) {
    facts.push(`${Math.round(meta.filament_weight_total)} g${meta.filament_type ? ` ${meta.filament_type.split(';')[0]}` : ''}`)
  } else if (meta.filament_type) {
    facts.push(meta.filament_type.split(';')[0])
  }
  return facts.join(' · ')
}

export type JobFilter = 'all' | 'never' | 'before'

/**
 * A file printed before has a history entry, or a time it last started.
 * The store gives every file a `history`, an empty one when it never
 * printed, so the entry counts only with a job in it.
 */
export function printedBefore (file: { history?: { job_id?: string } | null, print_start_time?: number | null }): boolean {
  return !!file.history?.job_id || !!file.print_start_time
}

export function filterJobs<T extends { history?: { job_id?: string } | null, print_start_time?: number | null }> (files: T[], filter: JobFilter): T[] {
  if (filter === 'never') return files.filter(f => !printedBefore(f))
  if (filter === 'before') return files.filter(f => printedBefore(f))
  return files
}

export type JobSort = 'newest' | 'name' | 'time'

export function sortJobs<T extends { filename: string, modified: number, estimated_time?: number }> (files: T[], sort: JobSort): T[] {
  const copy = [...files]
  if (sort === 'name') return copy.sort((a, b) => jobTitle(a.filename).localeCompare(jobTitle(b.filename)))
  if (sort === 'time') return copy.sort((a, b) => (a.estimated_time ?? Infinity) - (b.estimated_time ?? Infinity))
  return copy.sort((a, b) => b.modified - a.modified)
}

export interface ReadyCheck {
  ok: boolean;
  /** A warning rather than a stop: it can go in the queue. */
  warn?: boolean;
  text: string;
}

/**
 * What to know before a dropped G-code file prints: what it was sliced
 * for, whether its material is the one set, and whether the printer is
 * free. Nothing here stops it; it says so before anything moves.
 */
export function readyChecks (meta: Partial<KlipperFileMeta> | undefined, filename: string, material: string | null, printerName: string, busy: boolean): ReadyCheck[] {
  const checks: ReadyCheck[] = []
  if (/muon3d|\bm1\b/i.test(filename) || /muon3d/i.test(meta?.slicer ?? '')) {
    checks.push({ ok: true, text: 'Sliced for the Muon3D M1' })
  } else if (meta?.slicer) {
    checks.push({ ok: false, warn: true, text: `Sliced with ${meta.slicer}; not marked for the M1` })
  }
  const needs = meta?.filament_type?.split(';')[0]?.trim()
  if (needs) {
    if (!material) checks.push({ ok: false, warn: true, text: `Needs ${needs} · no material is set` })
    else if (material.toLowerCase() === needs.toLowerCase()) checks.push({ ok: true, text: `Needs ${needs} · ${material} is set` })
    else checks.push({ ok: false, warn: true, text: `Needs ${needs} · ${material} is set` })
  }
  if (busy) checks.push({ ok: false, warn: true, text: `${printerName} is busy · it can go next in the queue` })
  return checks
}

/** Files Slice opens, rather than the printer printing them. */
export const MODEL_FILES = /\.(stl|3mf|obj|step|stp)$/i

export function isModelFile (name: string): boolean {
  return MODEL_FILES.test(name)
}

export function isGcodeFile (name: string): boolean {
  return GCODE.test(name)
}

// -- File table ---------------------------------------------------------------

/** A row of the file table: a folder, or a file in the folder that's open. */
export interface TableRow {
  /** Its path in gcodes/, which is also its key. */
  key: string;
  kind: 'folder' | 'file';
  name: string;
  /** Seconds, from the slicer. */
  time?: number;
  /** Grams. */
  filament?: number;
  /** Millimetres. */
  layer?: number;
  /** The part's height, in millimetres. */
  height?: number;
  /** Seconds since 1970, as the printer gives it. */
  modified: number;
  /** Bytes; a folder's is the directory's own. */
  size: number;
}

export type TableColumn = 'name' | 'time' | 'filament' | 'layer' | 'height' | 'modified' | 'size'

export interface TableSort {
  column: TableColumn;
  desc: boolean;
}

function valueOf (row: TableRow, column: TableColumn): string | number | undefined {
  if (column === 'name') return row.name.toLowerCase()
  if (column === 'size' && row.kind === 'folder') return undefined
  return row[column]
}

/**
 * Folders first, then files by the column. Folders follow a sort by name
 * or date and stay A to Z otherwise, since they have no time or size of
 * their own. A file with no value in the column goes last either way, so
 * sorting by time doesn't lead with files the slicer gave no time.
 */
export function sortRows<T extends TableRow> (rows: T[], sort: TableSort): T[] {
  const by = ({ column, desc }: TableSort) => (a: T, b: T) => {
    const x = valueOf(a, column)
    const y = valueOf(b, column)
    if (x === undefined && y === undefined) return a.name.localeCompare(b.name)
    if (x === undefined) return 1
    if (y === undefined) return -1
    if (x === y) return a.name.localeCompare(b.name)
    return (typeof x === 'string' ? x.localeCompare(y as string) : x - (y as number)) * (desc ? -1 : 1)
  }
  const folderSort: TableSort = sort.column === 'name' || sort.column === 'modified' ? sort : { column: 'name', desc: false }
  const folders = rows.filter(r => r.kind === 'folder').sort(by(folderSort))
  const files = rows.filter(r => r.kind === 'file').sort(by(sort))
  return [...folders, ...files]
}

/** Clicking a column's head: the same column turns round; another starts the way people expect it (names A to Z, the rest biggest or newest first). */
export function nextSort (current: TableSort, column: TableColumn): TableSort {
  if (current.column === column) return { column, desc: !current.desc }
  return { column, desc: column !== 'name' }
}

/** Rows whose name has the text in it, any case. */
export function filterRows<T extends TableRow> (rows: T[], text: string): T[] {
  const q = text.trim().toLowerCase()
  return q ? rows.filter(r => r.name.toLowerCase().includes(q)) : rows
}

/** A checkbox click: in, or out. */
export function toggleKey (selected: string[], key: string): string[] {
  return selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]
}

/**
 * A shift-click: everything from the last row clicked to this one joins
 * the selection, in the order shown. With nothing clicked before, it's
 * this row alone.
 */
export function rangeSelect (order: string[], selected: string[], anchor: string | null, key: string): string[] {
  const from = anchor === null ? -1 : order.indexOf(anchor)
  const to = order.indexOf(key)
  if (to < 0) return selected
  if (from < 0) return selected.includes(key) ? selected : [...selected, key]
  const [lo, hi] = from < to ? [from, to] : [to, from]
  const range = order.slice(lo, hi + 1)
  return [...selected, ...range.filter(k => !selected.includes(k))]
}

/** "8.8 MB", "940 KB". */
export function fileSize (bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  if (bytes >= 1e3) return `${Math.round(bytes / 1e3)} KB`
  return `${bytes} B`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "today 14:02", "08 Oct", or "08 Oct 2025" from another year. */
export function shortDate (seconds: number, now: Date = new Date()): string {
  if (!seconds) return ''
  const d = new Date(seconds * 1000)
  const two = (n: number) => String(n).padStart(2, '0')
  if (d.toDateString() === now.toDateString()) return `today ${two(d.getHours())}:${two(d.getMinutes())}`
  const day = `${two(d.getDate())} ${MONTHS[d.getMonth()]}`
  return d.getFullYear() === now.getFullYear() ? day : `${day} ${d.getFullYear()}`
}

/** "53m 9s", "1h 24m": the table's print time, a little finer than the cards'. */
export function tableTime (seconds: number | undefined): string {
  if (!seconds) return '—'
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h) return `${h}h ${m}m`
  return m ? `${m}m ${s % 60}s` : `${s}s`
}

/** The folder above a path in gcodes/: '' is gcodes/ itself. */
export function parentFolder (path: string): string {
  return path.split('/').slice(0, -1).join('/')
}

/** What the selection bar's queue button says. */
export function queueLabel (count: number): string {
  if (count === 1) return 'Queue it'
  if (count === 2) return 'Queue both'
  return `Queue all ${count}`
}
