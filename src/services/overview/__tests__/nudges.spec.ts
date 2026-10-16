import { expect, it } from 'vitest'
import { firstLayerAllowed, missingDatabaseKey, nudgeBudget, nudgeFits, readNudgeEntry } from '../nudges'

it('allows only real M1 layers 1–3 with fresh printing, connection, homing and control', () => {
  const current = { m1: true, layer: 1, printing: true, ready: true, homed: true, waiting: false, identity: 'printer/job' }
  for (const layer of [0, 4, NaN]) expect(firstLayerAllowed({ ...current, layer })).toBe(false)
  for (const layer of [1, 3]) expect(firstLayerAllowed({ ...current, layer })).toBe(true)
  for (const key of ['m1', 'printing', 'ready', 'homed']) expect(firstLayerAllowed({ ...current, [key]: false })).toBe(false)
  expect(firstLayerAllowed({ ...current, waiting: true })).toBe(false)
  expect(firstLayerAllowed({ ...current, identity: '' })).toBe(false)
})

it('recognises only Moonraker-style 404s as absent database keys', () => {
  expect(missingDatabaseKey({ response: { status: 404 } })).toBe(true)
  expect(missingDatabaseKey({ response: { status: 500 } })).toBe(false)
  expect(missingDatabaseKey(new Error('offline'))).toBe(false)
})

it('derives the shared total and cap from printer truth relative to the saved baseline', () => {
  expect(nudgeBudget(0.03, 0)).toEqual({ total: 0.03, remaining: 0.07 })
  expect(nudgeFits(0.09, 0, 0.01)).toBe(true)
  expect(nudgeFits(0.1, 0, 0.01)).toBe(false)
  expect(nudgeFits(0.1, 0, -0.01)).toBe(true)
  expect(nudgeFits(NaN, 0, 0.01)).toBe(false)
})

it('validates structured shared entries', () => {
  expect(readNudgeEntry({ baseline: 0.02, start_time: 10, filename: 'x' })?.baseline).toBe(0.02)
  expect(readNudgeEntry({ baseline: '0.02', start_time: 10, filename: 'x' })).toBeNull()
  expect(readNudgeEntry(undefined)).toBeUndefined()
})
