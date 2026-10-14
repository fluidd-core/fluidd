import { describe, expect, it } from 'vitest'
import type { ItemSetup } from '../api'
import { fitText, printerFit, sameMaterial, type PrinterFacts } from '../fit'
import { agoText, cardFacts, findPrints, lastEvent, librarySummary, printedLine, printFacts, setupLine, storageLine, versionLine, versionWhen } from '../format'
import { targetRow } from '../print-targets'

const setup = (over: Partial<ItemSetup> = {}): ItemSetup => ({
  printer_model: 'Muon3D M1',
  nozzle_mm: 0.4,
  material: 'PLA',
  print_seconds: 4320,
  filament_g: 23.5,
  file_id: 'f-pla',
  ...over
})

const m1 = (over: Partial<PrinterFacts> = {}): PrinterFacts => ({ online: true, model: 'Muon3D M1', nozzleMm: 0.4, material: 'PLA', ...over })

describe('printerFit', () => {
  it('is ready when a G-code was sliced for this printer, nozzle and material', () => {
    const fit = printerFit([setup()], m1())
    expect(fit).toEqual({ kind: 'ready', setup: setup() })
    expect(fitText(fit)).toEqual({ label: 'Ready', action: 'print' })
  })

  it('asks for a re-slice when another material is loaded', () => {
    const fit = printerFit([setup()], m1({ material: 'PETG' }))
    expect(fit.kind).toBe('material')
    expect(fitText(fit)).toEqual({ label: 'PETG loaded. This print was sliced for PLA.', action: 'reslice' })
  })

  it('asks for a re-slice for another nozzle', () => {
    const fit = printerFit([setup()], m1({ nozzleMm: 0.6 }))
    expect(fitText(fit)).toEqual({ label: '0.6 mm nozzle. This print was sliced for 0.4 mm.', action: 'reslice' })
  })

  it('asks for a re-slice for another printer model', () => {
    const fit = printerFit([setup()], m1({ model: 'Muon3D M2' }))
    expect(fit.kind).toBe('model')
    expect(fitText(fit).action).toBe('reslice')
  })

  it('is offline before anything else', () => {
    expect(printerFit([setup()], m1({ online: false }))).toEqual({ kind: 'offline' })
    expect(fitText({ kind: 'offline' })).toEqual({ label: 'Offline', action: null })
  })

  it('a print with no G-code has to be sliced', () => {
    expect(fitText(printerFit([], m1())).action).toBe('reslice')
  })

  it('picks the G-code that fits among several', () => {
    const petg = setup({ material: 'PETG', file_id: 'f-petg' })
    const fit = printerFit([setup(), petg], m1({ material: 'PETG' }))
    expect(fit).toEqual({ kind: 'ready', setup: petg })
  })

  it('prefers a material change to a nozzle change when nothing fits', () => {
    const fit = printerFit([setup({ nozzle_mm: 0.6, material: 'PETG' }), setup({ material: 'ABS' })], m1({ material: 'PETG' }))
    expect(fit.kind).toBe('material')
  })

  it('holds nothing Fluidd couldn\'t read against the print', () => {
    expect(printerFit([setup()], m1({ material: null, nozzleMm: null, model: null })).kind).toBe('ready')
  })

  it('reads a material by its type: "PLA Silk" is PLA, "pla" is PLA, PETG is not', () => {
    expect(sameMaterial('PLA Silk', 'PLA')).toBe(true)
    expect(sameMaterial('pla', 'PLA')).toBe(true)
    expect(sameMaterial('PETG', 'PLA')).toBe(false)
    expect(sameMaterial('PLA', 'PETG')).toBe(false)
  })
})

describe('how a print reads', () => {
  it('names its setup, time and filament', () => {
    expect(setupLine(setup())).toBe('M1 · 0.4 · PLA')
    expect(printFacts(setup())).toBe('1h 12m · 24 g')
    expect(printFacts(setup({ print_seconds: null, filament_g: null }))).toBe('')
  })

  it('says where it was printed', () => {
    expect(printedLine({ printed_count: 3, last_printer_name: 'Boxwood' })).toBe('Printed 3× · Boxwood')
    expect(printedLine({ printed_count: 1, last_printer_name: 'Boxwood' })).toBe('Printed once · Boxwood')
    expect(printedLine({ printed_count: 0, last_printer_name: null })).toBe('Not printed yet')
  })

  it('says how much storage is used', () => {
    expect(storageLine(120e6, 2e9)).toBe('120 MB of 2 GB used')
    expect(storageLine(null, 2e9)).toBe('')
  })
})

describe('Print on rows', () => {
  const hazel = { id: 'h', name: 'Hazel', slug: 'hazel-52be', active: false }

  it('waits for a printer that has not said what it has loaded, and offers nothing meanwhile', () => {
    expect(targetRow(hazel, [setup()], null)).toMatchObject({ status: 'Checking', detail: 'Checking what it has loaded…', action: null, tone: 'wait' })
  })

  it('offers Print for a fit, saying what is loaded and how long it takes', () => {
    expect(targetRow(hazel, [setup()], m1())).toMatchObject({
      status: 'Ready',
      detail: 'PLA loaded · 0.4 mm nozzle. Sliced for exactly this.',
      note: '1h 12m · 24 g',
      action: 'print',
      tone: 'ok',
      slug: 'hazel-52be'
    })
  })

  it('offers Re-slice for the material loaded, and nothing for a printer offline', () => {
    expect(targetRow(hazel, [setup()], m1({ material: 'PETG' }))).toMatchObject({
      detail: 'PETG loaded. This print was sliced for PLA.',
      reslice: 'Re-slice for PETG',
      action: 'reslice',
      tone: 'warn'
    })
    expect(targetRow(hazel, [setup()], m1({ online: false }))).toMatchObject({ status: 'Offline', action: null, tone: 'off' })
  })

  it('puts a print in the queue of a printer busy printing', () => {
    expect(targetRow(hazel, [setup()], m1(), { busy: 'NGMI stamp' })).toMatchObject({ status: 'Queue', detail: 'Printing NGMI stamp now', action: 'queue', tone: 'run' })
  })

  it('never queues on a printer it does not fit', () => {
    expect(targetRow(hazel, [setup()], m1({ material: 'PETG' }), { busy: 'NGMI stamp' }).action).toBe('reslice')
  })

  it('says so when the printer did not answer what it has loaded', () => {
    expect(targetRow(hazel, [setup()], m1({ material: null, nozzleMm: null }), { unread: true }).detail)
      .toBe('Sliced for M1 · 0.4 · PLA. It didn\'t say what it has loaded.')
  })
})

describe('finding prints', () => {
  const prints = [
    { name: 'Carousel wheel', updated_at: '2026-10-08T10:00:00Z' },
    { name: 'Leaf dragon', updated_at: '2026-10-12T10:00:00Z' },
    { name: 'carousel base', updated_at: '2026-10-10T10:00:00Z' }
  ]

  it('finds by every word, whatever the case, newest first', () => {
    expect(findPrints(prints, 'CAROUSEL', 'recent').map(p => p.name)).toEqual(['carousel base', 'Carousel wheel'])
    expect(findPrints(prints, 'carousel whe', 'recent').map(p => p.name)).toEqual(['Carousel wheel'])
    expect(findPrints(prints, '', 'recent').map(p => p.name)).toEqual(['Leaf dragon', 'carousel base', 'Carousel wheel'])
  })

  it('sorts by name', () => {
    expect(findPrints(prints, '', 'name').map(p => p.name)).toEqual(['carousel base', 'Carousel wheel', 'Leaf dragon'])
  })

  it('sums up the Library', () => {
    expect(librarySummary(1, 820e3, 2e9)).toBe('1 print · 820 KB of 2 GB used')
    expect(librarySummary(6, null, null)).toBe('6 prints')
  })
})

describe('when, and what happened last', () => {
  const now = Date.parse('2026-10-12T15:00:00Z')

  it('says how long ago', () => {
    expect(agoText('2026-10-12T14:59:45Z', now)).toBe('just now')
    expect(agoText('2026-10-12T14:48:00Z', now)).toBe('12 min ago')
    expect(agoText('2026-10-12T13:00:00Z', now)).toBe('2 h ago')
    expect(agoText('2026-10-11T12:00:00Z', now)).toBe('yesterday')
    expect(agoText('2026-10-09T15:00:00Z', now)).toBe('3 days ago')
    expect(agoText(null, now)).toBe('')
  })

  it('names the last print when nothing was saved after it, else the save', () => {
    expect(lastEvent({ last_printed_at: '2026-10-11T12:00:00Z', last_printer_name: 'Walnut', updated_at: '2026-10-11T12:00:20Z' }, now))
      .toEqual({ text: 'Printed on Walnut · yesterday', printed: true })
    expect(lastEvent({ last_printed_at: '2026-10-11T12:00:00Z', last_printer_name: 'Walnut', updated_at: '2026-10-12T13:00:00Z' }, now))
      .toEqual({ text: 'Saved from Slice · 2 h ago', printed: false })
    expect(lastEvent({ last_printed_at: null, last_printer_name: null, updated_at: '2026-10-12T13:00:00Z' }, now).printed).toBe(false)
  })

  it('sums up a card: a print by its material, time and filament; a model by its format and size', () => {
    expect(cardFacts({ versioned: true, setups: [setup()], format: '3mf', size_bytes: 1 })).toBe('PLA · 1h 12m · 24 g')
    expect(cardFacts({ versioned: false, setups: [], format: 'stl', size_bytes: 4.2e6 })).toBe('STL · 4.2 MB')
    expect(cardFacts({ versioned: true, setups: [], format: '3mf', size_bytes: 1 })).toBe('')
  })

  it('reads a version: when, and what it was sliced with', () => {
    expect(versionWhen('2026-10-12T14:02:00', new Date('2026-10-12T18:00:00'))).toBe('Today 14:02')
    expect(versionWhen('2026-10-11T21:40:00', new Date('2026-10-12T18:00:00'))).toBe('Yesterday 21:40')
    expect(versionWhen('2026-10-09T08:00:00', new Date('2026-10-12T18:00:00'))).toBe('Fri 9 Oct')
    const gcode = { id: 'g', role: 'gcode' as const, format: 'gcode' as const, encoding: 'gzip' as const, size_bytes: 1, sha256: 'x', setup: { printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PETG' } }
    expect(versionLine({ summary: { layer_height_mm: 0.2, quality: 'Normal', strength: 'Strong', supports: false }, files: [gcode] }))
      .toBe('0.20 mm · Normal · Strong · supports off · PETG')
    expect(versionLine({ summary: null, files: [] })).toBe('')
  })
})
