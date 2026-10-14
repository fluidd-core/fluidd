/**
 * Print on…: whether a saved print can go to a printer as it is. A print
 * may hold several G-codes, each sliced for a printer model, a nozzle and a
 * material; the printer has a model, a nozzle and what it has loaded (the
 * save_variables muon_material the panel, Overview and Control set). The
 * best of its G-codes decides:
 *
 * - ready: one was sliced for exactly this;
 * - material: the right printer and nozzle, but another material is loaded
 *   ("PETG loaded. This was sliced for PLA"): its temperatures would be
 *   wrong, so it is re-sliced, never printed;
 * - nozzle, model: sliced for another nozzle or printer: re-sliced;
 * - unsliced: the print has no G-code yet;
 * - offline: the printer can't take it now.
 *
 * What Fluidd can't read (a printer that hasn't said what's loaded) is not
 * held against the print.
 */
import { bridgeModel } from '@/services/slicer-bridge/selection'
import type { ItemSetup } from './api'
import { nozzleText, shortModel } from './format'

/** What a printer is, and has loaded, as far as Fluidd knows. */
export interface PrinterFacts {
  online: boolean;
  /** As the slicer's profiles name it ("Muon3D M1"), or null when unknown. */
  model: string | null;
  nozzleMm: number | null;
  /** What it has loaded ("PETG"), or null when nobody has said. */
  material: string | null;
}

export type Fit =
  | { kind: 'offline' }
  | { kind: 'unsliced' }
  | { kind: 'ready', setup: ItemSetup }
  | { kind: 'material', setup: ItemSetup, loaded: string }
  | { kind: 'nozzle', setup: ItemSetup, nozzleMm: number }
  | { kind: 'model', setup: ItemSetup, model: string }

/** Better first: a G-code that fits beats one that only needs a different spool. */
const RANK = { ready: 0, material: 1, nozzle: 2, model: 3 } as const

const words = (text: string) => text.toUpperCase().split(/[^A-Z0-9+]+/).filter(Boolean)

/** "PLA" is "pla", and is in "PLA Silk"; "PLA" is not "PETG". */
export function sameMaterial (loaded: string, sliced: string): boolean {
  const a = loaded.trim().toUpperCase()
  const b = sliced.trim().toUpperCase()
  if (!a || !b) return true
  return a === b || words(loaded).includes(b) || words(sliced).includes(a)
}

export function sameNozzle (a: number, b: number): boolean {
  return Math.abs(a - b) < 0.005
}

export function sameModel (a: string, b: string): boolean {
  return (bridgeModel(a) ?? a).toLowerCase() === (bridgeModel(b) ?? b).toLowerCase()
}

/** How one G-code fits an online printer. */
export function setupFit (setup: ItemSetup, printer: PrinterFacts): Exclude<Fit, { kind: 'offline' | 'unsliced' }> {
  if (printer.model && !sameModel(printer.model, setup.printer_model)) return { kind: 'model', setup, model: printer.model }
  if (printer.nozzleMm !== null && !sameNozzle(printer.nozzleMm, setup.nozzle_mm)) return { kind: 'nozzle', setup, nozzleMm: printer.nozzleMm }
  if (printer.material && !sameMaterial(printer.material, setup.material)) return { kind: 'material', setup, loaded: printer.material }
  return { kind: 'ready', setup }
}

/** The fit of the print's best G-code for this printer. */
export function printerFit (setups: ItemSetup[], printer: PrinterFacts): Fit {
  if (!printer.online) return { kind: 'offline' }
  let best: Exclude<Fit, { kind: 'offline' | 'unsliced' }> | null = null
  for (const setup of setups) {
    const fit = setupFit(setup, printer)
    if (!best || RANK[fit.kind] < RANK[best.kind]) best = fit
  }
  return best ?? { kind: 'unsliced' }
}

export interface FitText {
  /** What the row says. */
  label: string;
  /** Print: it can go now. Re-slice: open it in Slice for this printer. */
  action: 'print' | 'reslice' | null;
}

export function fitText (fit: Fit): FitText {
  switch (fit.kind) {
    case 'offline':
      return { label: 'Offline', action: null }
    case 'unsliced':
      return { label: 'No G-code saved yet', action: 'reslice' }
    case 'ready':
      return { label: 'Ready', action: 'print' }
    case 'material':
      return { label: `${fit.loaded} loaded. This print was sliced for ${fit.setup.material}.`, action: 'reslice' }
    case 'nozzle':
      return { label: `${nozzleText(fit.nozzleMm)} mm nozzle. This print was sliced for ${nozzleText(fit.setup.nozzle_mm)} mm.`, action: 'reslice' }
    case 'model':
      return { label: `This print was sliced for the ${shortModel(fit.setup.printer_model)}, not the ${shortModel(fit.model)}.`, action: 'reslice' }
  }
}
