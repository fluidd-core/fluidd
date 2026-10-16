import { expect, it } from 'vitest'
import { firstLayerAllowed, nudgeBudget, nudgeFits, readBaseline } from '../nudges'

it('allows only real M1 layers 1–3 with fresh printing, connection, homing and control', () => {
  const current = { m1: true, layer: 1, printing: true, ready: true, homed: true, waiting: false, identity: 'printer/job' }
  for (const layer of [0, 4, NaN]) expect(firstLayerAllowed({ ...current, layer })).toBe(false)
  for (const layer of [1, 3]) expect(firstLayerAllowed({ ...current, layer })).toBe(true)
  for (const key of ['m1', 'printing', 'ready', 'homed']) expect(firstLayerAllowed({ ...current, [key]: false })).toBe(false)
  expect(firstLayerAllowed({ ...current, waiting: true })).toBe(false)
  expect(firstLayerAllowed({ ...current, identity: '' })).toBe(false)
})

it('derives the shared total and cap from printer truth relative to the saved baseline', () => {
  expect(nudgeBudget(0.03, 0)).toEqual({ total: 0.03, remaining: 0.07 })
  expect(nudgeFits(0.09, 0, 0.01)).toBe(true)
  expect(nudgeFits(0.1, 0, 0.01)).toBe(false)
  expect(nudgeFits(0.1, 0, -0.01)).toBe(true)
  expect(nudgeFits(NaN, 0, 0.01)).toBe(false)
})

it('reads only finite baselines at the exact shared database key', () => {
  expect(readBaseline({ firstLayerNudges: { printer: { job: 0.02 } } }, 'firstLayerNudges.printer.job')).toBe(0.02)
  expect(readBaseline({ firstLayerNudges: { printer: { job: '0.02' } } }, 'firstLayerNudges.printer.job')).toBeNull()
  expect(readBaseline({}, 'firstLayerNudges.printer.job')).toBeUndefined()
})
