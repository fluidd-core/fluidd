import { smoothChartData } from '../chart-smoothing'
import type { ChartData } from '@/store/charts/types'

// Build a series of 1Hz samples starting at epoch t=0s.
// Each entry maps a base value -> { date, [key]: value, extruder: <temp> }.
const buildSeries = (
  key: string,
  values: (number | null)[],
  temps?: number[]
): ChartData[] =>
  values.map((value, i) => {
    const sample: ChartData = { date: new Date(i * 1000) }
    if (value !== null) sample[key] = value
    if (temps) sample.extruder = temps[i]
    return sample
  })

describe('smoothChartData', () => {
  it('returns input unchanged when window is 0', () => {
    const data = buildSeries('extruder#power', [0, 100, 0, 100])
    expect(smoothChartData(data, ['extruder#power'], 0)).toBe(data)
  })

  it('returns input unchanged for a negative window', () => {
    const data = buildSeries('extruder#power', [0, 100, 0, 100])
    expect(smoothChartData(data, ['extruder#power'], -3)).toBe(data)
  })

  it('returns input unchanged when keys is empty', () => {
    const data = buildSeries('extruder#power', [0, 100, 0, 100])
    expect(smoothChartData(data, [], 3)).toBe(data)
  })

  it('ignores a key no sample carries', () => {
    const data = buildSeries('extruder#power', [0, 100, 0, 100])
    const out = smoothChartData(data, ['bed#power'], 3)

    out.forEach((s, i) => expect(s).toEqual(data[i]))
  })

  it('averages all preceding values once the trailing window spans them', () => {
    const data = buildSeries('extruder#power', [0, 100, 0, 100, 0, 100])
    const out = smoothChartData(data, ['extruder#power'], 1000)
    const mean = (0 + 100 + 0 + 100 + 0 + 100) / 6

    expect(out[out.length - 1]['extruder#power']).toBeCloseTo(mean, 5)
  })

  it('applies a trailing moving average to a square wave (window=3s, 1Hz)', () => {
    const data = buildSeries('extruder#power', [0, 100, 0, 100, 0, 100])
    const out = smoothChartData(data, ['extruder#power'], 3)
    const got = out.map(s => s['extruder#power'] as number)

    expect(got[0]).toBeCloseTo(0, 5) // {0}
    expect(got[1]).toBeCloseTo(50, 5) // {0,100}
    expect(got[2]).toBeCloseTo(100 / 3, 5) // {0,100,0}
    expect(got[3]).toBeCloseTo(200 / 3, 5) // {100,0,100}
    expect(got[4]).toBeCloseTo(100 / 3, 5) // {0,100,0}
    expect(got[5]).toBeCloseTo(200 / 3, 5) // {100,0,100}
  })

  it('leaves keys absent from the keys list (temps) and date untouched', () => {
    const data = buildSeries('extruder#power', [0, 100, 0, 100], [200, 201, 202, 203])
    const out = smoothChartData(data, ['extruder#power'], 3)

    out.forEach((s, i) => {
      expect(s.extruder).toBe(data[i].extruder) // temps raw
      expect(s.date).toBe(data[i].date) // same Date reference
    })
  })

  it('skips null/missing values in the window mean', () => {
    // index 2 has no power value at all
    const data = buildSeries('extruder#power', [0, 100, null, 100])
    const out = smoothChartData(data, ['extruder#power'], 3)

    expect(out[1]['extruder#power']).toBeCloseTo(50, 5) // {0,100}
    // window at i=3 is {100 (i1), <gap>, 100 (i3)} -> mean of the two present = 100
    expect(out[3]['extruder#power']).toBeCloseTo(100, 5)
    // a sample with no value stays without a value (not invented)
    expect(out[2]['extruder#power']).toBeUndefined()
  })

  it('does not mutate the input array or its samples', () => {
    const data = buildSeries('extruder#power', [0, 100, 0, 100])
    const snapshot = JSON.stringify(data)
    smoothChartData(data, ['extruder#power'], 3)
    expect(JSON.stringify(data)).toBe(snapshot)
  })
})
