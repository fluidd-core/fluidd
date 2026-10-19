import { describe, expect, it } from 'vitest'
import { cardLayout, moveCard } from '../cards'
import { firstLayerAllowed, readNudgeEntry } from '../nudges'
import { chartLines, chartWindows, defaultChartWindow, filamentFact, heaterTile, longDuration } from '../model'
import { historyPath, observedEvents, retainedSamples, sampleAt } from '../timeline'

describe('Overview hardening branches', () => {
  it('clamps heater progress below ambient and across a degenerate target range', () => {
    expect(heaterTile(-20, 100).progress).toBe(0)
    expect(heaterTile(21, 21, 22)).toMatchObject({ status: 'at temperature', progress: 1 })
  })

  it('handles absent filament totals and negative durations at their boundaries', () => {
    expect(filamentFact(0, null, null)).toBeNull()
    expect(filamentFact(250, null, null)).toBe('0.25 m')
    expect(longDuration(-100)).toBe('0 min')
  })

  it('uses safe defaults for tiny retention windows and an empty window choice', () => {
    expect(chartWindows(-1)).toEqual([{ value: 60, label: '1 min' }])
    expect(defaultChartWindow([])).toBe(300)
  })

  // BUG: chartLines accepts NaN as a numeric reading and emits an invalid SVG path.
  it('drops non-finite chart readings instead of drawing NaN coordinates', () => {
    expect(chartLines([{ date: new Date(1000), extruder: Number.NaN }], ['extruder'], 60, 1000).lines).toEqual([])
  })

  it('sanitises unknown and duplicate cards and refuses out-of-range moves', () => {
    expect(cardLayout(['queue', 'unknown', 'queue', 4])).toEqual(['queue'])
    expect(moveCard(['queue', 'temperatures'], 'queue', -1)).toEqual(['queue', 'temperatures'])
    expect(moveCard(['queue', 'temperatures'], 'missing', 1)).toEqual(['queue', 'temperatures'])
  })

  it('rejects corrupt or non-finite nudge records', () => {
    const values = [null, 'not an entry', {}, { baseline: Number.NaN, start_time: 1, filename: 'print' }, { baseline: 0, start_time: Number.NaN, filename: 'print' }, { baseline: 0, start_time: 1, filename: 4 }, { baseline: 0, start_time: 1, filename: 'print', expected: Number.NaN }, { baseline: 0, start_time: 1, filename: 'print', pending: { created: Number.NaN, from: 0 } }]
    for (const value of values) expect(readNudgeEntry(value)).toBeNull()
  })

  it('drops invalid samples, breaks paths on reversed time, and ignores invalid layer events', () => {
    const points = retainedSamples({
      extruder: { temperatures: [Number.NaN, 200], targets: [0, 210] },
      'temperature_sensor chamber': { temperatures: [30, 31], targets: [99, 99] },
      invalid: { targets: [1] }
    }, 3000, 2)
    expect(points[0].extruder).toBeUndefined()
    expect(points[1].extruder).toBe(200)
    expect(points[1]['temperature_sensor chamberTarget']).toBeUndefined()
    expect(sampleAt([{ date: new Date('bad'), value: 1 }], 0)).toBeNull()
    expect(historyPath([{ date: new Date(2000), x: 1 }, { date: new Date(1000), x: 2 }], 'x', 0, 3000, 300, n => n)).toBe('M200.0 1.0 M100.0 2.0')
    const previous = { context: 'p', layer: 1, filament: {} }
    expect(observedEvents(previous, { ...previous, layer: 1.5 }, 1)).toEqual([])
  })

  it('rejects fractional layers even when every other first-layer condition is true', () => {
    expect(firstLayerAllowed({ m1: true, layer: 1.5, printing: true, ready: true, homed: true, waiting: false, identity: 'p/job' })).toBe(false)
  })
})
