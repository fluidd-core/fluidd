import { smoothChartSource } from '../chart-smoothing'
import { appendChartSample, chartBufferSource, createChartBuffer } from '../chart-buffer'
import type { ChartBuffer } from '@/store/charts/types'

// Builds a buffer of 1Hz samples starting at epoch t=0s, one column, values
// possibly interrupted by gaps (null -> no value appended for that sample).
const buildBuffer = (key: string, values: (number | null)[]): ChartBuffer => {
  const buffer = createChartBuffer(600, [key])

  values.forEach((value, i) => {
    appendChartSample(buffer, i * 1000, value === null ? {} : { [key]: value })
  })

  return buffer
}

describe('smoothChartSource', () => {
  it('returns the same source reference when window is 0', () => {
    const buffer = buildBuffer('extruder#power', [0, 100, 0, 100])
    expect(smoothChartSource(buffer, ['extruder#power'], 0)).toBe(chartBufferSource(buffer))
  })

  it('returns the same source reference for a negative window', () => {
    const buffer = buildBuffer('extruder#power', [0, 100, 0, 100])
    expect(smoothChartSource(buffer, ['extruder#power'], -3)).toBe(chartBufferSource(buffer))
  })

  it('returns the same source reference when columns is empty', () => {
    const buffer = buildBuffer('extruder#power', [0, 100, 0, 100])
    expect(smoothChartSource(buffer, [], 3)).toBe(chartBufferSource(buffer))
  })

  it('is a no-op for a column no sample carries', () => {
    const buffer = buildBuffer('extruder#power', [0, 100, 0, 100])
    const out = smoothChartSource(buffer, ['bed#power'], 3)

    expect(out).toEqual(chartBufferSource(buffer))
  })

  it('averages all preceding values once the trailing window spans them', () => {
    const buffer = buildBuffer('extruder#power', [0, 100, 0, 100, 0, 100])
    const out = smoothChartSource(buffer, ['extruder#power'], 1000)
    const mean = (0 + 100 + 0 + 100 + 0 + 100) / 6

    expect(out['extruder#power'][5]).toBeCloseTo(mean, 5)
  })

  it('applies a trailing moving average to a square wave (window=3s, 1Hz)', () => {
    const buffer = buildBuffer('extruder#power', [0, 100, 0, 100, 0, 100])
    const out = smoothChartSource(buffer, ['extruder#power'], 3)
    const got = Array.from(out['extruder#power'])

    expect(got[0]).toBeCloseTo(0, 5) // {0}
    expect(got[1]).toBeCloseTo(50, 5) // {0,100}
    expect(got[2]).toBeCloseTo(100 / 3, 5) // {0,100,0}
    expect(got[3]).toBeCloseTo(200 / 3, 5) // {100,0,100}
    expect(got[4]).toBeCloseTo(100 / 3, 5) // {0,100,0}
    expect(got[5]).toBeCloseTo(200 / 3, 5) // {100,0,100}
  })

  it('leaves columns absent from the columns list (date, other series) untouched', () => {
    const buffer = createChartBuffer(600, ['extruder#power', 'extruder'])

    appendChartSample(buffer, 0, { 'extruder#power': 0, extruder: 200 })
    appendChartSample(buffer, 1000, { 'extruder#power': 100, extruder: 201 })
    appendChartSample(buffer, 2000, { 'extruder#power': 0, extruder: 202 })

    const rawSource = chartBufferSource(buffer)
    const out = smoothChartSource(buffer, ['extruder#power'], 3)

    // Untouched columns pass through as the exact same view.
    expect(out.date).toBe(rawSource.date)
    expect(out.extruder).toBe(rawSource.extruder)
    // The smoothed column is a distinct array.
    expect(out['extruder#power']).not.toBe(rawSource['extruder#power'])
  })

  it('skips gaps (NaN) in the window mean and preserves them in the output', () => {
    // index 2 has no power value at all
    const buffer = buildBuffer('extruder#power', [0, 100, null, 100])
    const out = smoothChartSource(buffer, ['extruder#power'], 3)
    const got = out['extruder#power']

    expect(got[1]).toBeCloseTo(50, 5) // {0,100}
    // window at i=3 is {100 (i1), <gap>, 100 (i3)} -> mean of the two present = 100
    expect(got[3]).toBeCloseTo(100, 5)
    // a sample with no value stays without a value (not invented)
    expect(Number.isNaN(got[2])).toBe(true)
  })

  it('does not mutate the buffer', () => {
    const buffer = buildBuffer('extruder#power', [0, 100, 0, 100])
    const before = Array.from(buffer.columns['extruder#power'])

    smoothChartSource(buffer, ['extruder#power'], 3)

    expect(Array.from(buffer.columns['extruder#power'])).toEqual(before)
  })
})
