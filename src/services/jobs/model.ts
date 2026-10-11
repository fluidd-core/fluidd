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
