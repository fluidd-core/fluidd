import { expect, it } from 'vitest'
import { retainedSamples, sampleAt, observedEvents, historyPath, missingIntervals } from '../timeline'
import type { ChartPoint } from '../model'

it('uses only actual retained samples and aligns uneven sensor arrays at their newest end', () => {
  const points = retainedSamples({ extruder: { temperatures: [210, 211, null] }, heater_bed: { temperatures: [55, 56] } }, 10000, 1200)
  expect(points.map(p => [p.date.getTime(), p.extruder, p.heater_bed])).toEqual([[8000, 210, undefined], [9000, 211, 55], [10000, undefined, 56]])
  expect(sampleAt(points, 2000)).toBe(null)
  expect(sampleAt(points, 9000)?.extruder).toBe(211)
})

it('reports every missing interval across displayed series', () => {
  const points: ChartPoint[] = [
    { date: new Date(1000), extruder: 200, heater_bed: 55 },
    { date: new Date(2000), extruder: 201 },
    { date: new Date(3000), extruder: 202, heater_bed: 56 },
    { date: new Date(7000), extruder: 203, heater_bed: 57 }
  ]
  expect(missingIntervals(points, ['extruder', 'heater_bed'], 0, 8000)).toEqual([
    { from: 0, to: 500 }, { from: 1500, to: 2500 }, { from: 3500, to: 6500 }, { from: 7500, to: 8000 }
  ])
})

it('breaks drawn history at missing values and reconnect gaps rather than interpolating', () => {
  const points: ChartPoint[] = [{ date: new Date(1000), extruder: 200 }, { date: new Date(2000) }, { date: new Date(3000), extruder: 202 }, { date: new Date(9000), extruder: 203 }]
  expect(historyPath(points, 'extruder', 0, 10000, 100, v => v)).toBe('M10.0 200.0 M30.0 202.0 M90.0 203.0')
  expect(sampleAt(points, 6000)).toBe(null)
  expect(sampleAt(points, 2000)).toBe(null)
})

it('marks only observed layer, pause/resume and real filament transitions, clearing across contexts', () => {
  const first = { context: 'alice/a/print-1', layer: 1, paused: false, filament: { insert: true } }
  expect(observedEvents(null, first, 1000)).toEqual([])
  expect(observedEvents(first, { ...first, layer: 2, paused: true, filament: { insert: false } }, 2000)).toEqual([
    { at: 2000, label: 'Layer 2' }, { at: 2000, label: 'Paused' }, { at: 2000, label: 'insert: filament absent' }
  ])
  expect(observedEvents({ ...first, paused: true }, first, 3000)).toEqual([{ at: 3000, label: 'Resumed' }])
  expect(observedEvents(first, { ...first, context: 'bob/b/print-2', layer: 3 }, 4000)).toEqual([])
})
