import { expect, it } from 'vitest'
import { firstLayerAllowed, reserveNudge } from '../nudges'
it('allows only real M1 layers 1–3 with fresh printing, connection, homing and control', () => {
  const current = { m1: true, layer: 1, printing: true, ready: true, homed: true, waiting: false, identity: 'printer/job' }
  for (const layer of [0, 4, NaN]) expect(firstLayerAllowed({ ...current, layer })).toBe(false)
  for (const layer of [1, 3]) expect(firstLayerAllowed({ ...current, layer })).toBe(true)
  for (const key of ['m1', 'printing', 'ready', 'homed']) expect(firstLayerAllowed({ ...current, [key]: false })).toBe(false)
  expect(firstLayerAllowed({ ...current, waiting: true })).toBe(false)
  expect(firstLayerAllowed({ ...current, identity: '' })).toBe(false)
})
it('caps cumulative travel per identified print across remounts and counts opposite directions', () => {
  localStorage.clear()
  for (let i = 0; i < 5; i++) { expect(reserveNudge(localStorage, 'printer/job', -0.01)?.total).toBeCloseTo(-(i + 1) * 0.01) }
  for (let i = 0; i < 5; i++) expect(reserveNudge(localStorage, 'printer/job', 0.01)).not.toBe(null)
  expect(reserveNudge(localStorage, 'printer/job', 0.01)).toBe(null)
  expect(reserveNudge(localStorage, 'printer/job', -0.01)).toBe(null)
  expect(reserveNudge(localStorage, 'printer/new-job', 0.01)?.total).toBe(0.01)
  expect(reserveNudge(localStorage, 'printer/job', 0.02)).toBe(null)
})
