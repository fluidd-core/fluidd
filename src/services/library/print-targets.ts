/**
 * The rows of Print on… and of a print's "Your printers": one per account
 * printer, with what fit.ts says of this print on it, what it is doing, and
 * what the row offers.
 */
import type { ItemSetup } from './api'
import { fitText, printerFit, type Fit, type PrinterFacts } from './fit'
import { nozzleText, printFacts, setupLine } from './format'
import type { PrintTarget } from './print-on'

export type RowAction = 'print' | 'queue' | 'reslice' | null

export interface TargetRow extends PrintTarget {
  fit: Fit;
  /** The pill: Ready, Queue, Offline, Checking. Empty when the row offers a button instead. */
  status: string;
  /** What it has loaded, or why the print doesn't fit. */
  detail: string;
  /** How long and how much, or what the action does. */
  note: string;
  action: RowAction;
  /** The Re-slice button's words: "Re-slice for PLA". */
  reslice: string;
  /** ok: it fits; run: it goes in the queue; warn: re-slice; off: offline; wait: still being asked. */
  tone: 'ok' | 'run' | 'warn' | 'off' | 'wait';
}

export interface RowState {
  /** It was asked what it has loaded and didn't answer. */
  unread?: boolean;
  /** It is printing (or paused) now: what it is printing. */
  busy?: string | null;
}

/** "PETG loaded · 0.4 mm nozzle", as much as the printer said. */
function loadedLine (facts: PrinterFacts): string {
  const parts: string[] = []
  if (facts.material) parts.push(`${facts.material} loaded`)
  if (facts.nozzleMm !== null) parts.push(`${nozzleText(facts.nozzleMm)} mm nozzle`)
  return parts.join(' · ')
}

/**
 * A printer's row. `facts` null: it is online but hasn't said yet what it
 * has loaded.
 */
export function targetRow (target: PrintTarget, setups: ItemSetup[], facts: PrinterFacts | null, state: RowState = {}): TargetRow {
  const base = { ...target, status: '', detail: '', note: '', reslice: '' }
  if (!facts) return { ...base, fit: { kind: 'offline' }, status: 'Checking', detail: 'Checking what it has loaded…', action: null, tone: 'wait' }
  const fit = printerFit(setups, facts)
  switch (fit.kind) {
    case 'offline':
      return { ...base, fit, status: 'Offline', detail: 'Offline', action: null, tone: 'off' }
    case 'ready': {
      const loaded = loadedLine(facts)
      const detail = state.unread
        ? `Sliced for ${setupLine(fit.setup)}. It didn't say what it has loaded.`
        : loaded ? `${loaded}. Sliced for exactly this.` : `Sliced for ${setupLine(fit.setup)}.`
      if (state.busy) {
        return { ...base, fit, status: 'Queue', detail: `Printing ${state.busy} now`, note: 'Queued prints start once the plate has been cleared.', action: 'queue', tone: 'run' }
      }
      return { ...base, fit, status: 'Ready', detail, note: printFacts(fit.setup), action: 'print', tone: 'ok' }
    }
    case 'unsliced':
      return { ...base, fit, detail: fitText(fit).label, note: 'Open it in Slice to slice it for this printer.', action: 'reslice', reslice: 'Slice it', tone: 'warn' }
    default:
      return {
        ...base,
        fit,
        detail: fitText(fit).label,
        note: `Re-slicing opens it in Slice for ${target.name} and saves a version.`,
        action: 'reslice',
        reslice: fit.kind === 'material' ? `Re-slice for ${fit.loaded}` : 'Re-slice',
        tone: 'warn'
      }
  }
}
