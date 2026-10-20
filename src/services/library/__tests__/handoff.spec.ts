import { describe, expect, it } from 'vitest'
import { defaultPrintTarget, handoffWarnings } from '../handoff'
import type { TargetRow } from '../print-targets'

const setup = { printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PLA', file_id: 'g', print_seconds: 60, filament_g: 2 }
const row = (part: Partial<TargetRow>): TargetRow => ({ id: 'p', name: 'Pine', slug: 'pine-1', active: false, fit: { kind: 'ready', setup }, status: 'Ready', detail: '', note: '', action: 'print', reslice: '', tone: 'ok', ...part })

describe('Library hand-off choice', () => {
  it('chooses only an online, matching, idle printer', () => {
    const busy = row({ id: 'busy', action: 'queue', tone: 'run' })
    const mismatch = row({ id: 'wrong', fit: { kind: 'material', setup, loaded: 'PETG' }, action: 'reslice', tone: 'warn' })
    expect(defaultPrintTarget([busy, mismatch, row({ id: 'best' })])?.id).toBe('best')
    expect(defaultPrintTarget([busy, mismatch])).toBeNull()
  })

  it('warns for busy, offline, and setup mismatch', () => {
    expect(handoffWarnings(row({ action: 'queue', tone: 'run' }), setup)[0]).toContain('busy')
    expect(handoffWarnings(row({ tone: 'off', fit: { kind: 'offline' }, action: null }), setup)[0]).toContain('offline')
    expect(handoffWarnings(row({ fit: { kind: 'material', setup, loaded: 'PETG' }, detail: 'PETG loaded; sliced for PLA', tone: 'warn' }), setup)).toContain('PETG loaded; sliced for PLA')
  })
})
