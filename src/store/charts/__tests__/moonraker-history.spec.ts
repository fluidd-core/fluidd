import { moonrakerChartSamples } from '../moonraker-history'

const stats = (
  length: number,
  cpuUsage: (index: number) => number,
  startTime = 1000
): Moonraker.ProcStats.MoonrakerStats[] =>
  Array.from({ length }, (_, index) => ({
    time: startTime + index,
    cpu_usage: cpuUsage(index),
    memory: 0,
    mem_units: 'kB'
  }))

describe('moonrakerChartSamples', () => {
  it('converts timestamps to milliseconds and rounds load to 2 decimal places', () => {
    const samples = moonrakerChartSamples(stats(3, index => 10.126 + index), -Infinity)

    expect(samples).toEqual([
      { time: 1_000_000, values: { load: 10.13 } },
      { time: 1_001_000, values: { load: 11.13 } },
      { time: 1_002_000, values: { load: 12.13 } }
    ])
  })

  it('keeps only the samples past the tail', () => {
    const samples = moonrakerChartSamples(stats(5, index => index), 1_002_000)

    expect(samples).toEqual([
      { time: 1_003_000, values: { load: 3 } },
      { time: 1_004_000, values: { load: 4 } }
    ])
  })

  it('yields nothing for an entirely stale backlog', () => {
    expect(moonrakerChartSamples(stats(3, index => index), 1_002_000)).toEqual([])
  })

  it('yields nothing for an empty backlog', () => {
    expect(moonrakerChartSamples([], -Infinity)).toEqual([])
  })

  it('skips out-of-range samples without leaving a gap', () => {
    const samples = moonrakerChartSamples(stats(4, index => (index === 1 ? 4523.7 : index)), -Infinity)

    expect(samples.map(sample => sample.time)).toEqual([1_000_000, 1_002_000, 1_003_000])
    expect(samples.map(sample => sample.values.load)).toEqual([0, 2, 3])
  })

  it('yields a monotonically increasing timeline', () => {
    const samples = moonrakerChartSamples(stats(1800, index => index % 100), -Infinity)

    expect(samples).toHaveLength(1800)

    for (let index = 1; index < samples.length; index++) {
      expect(samples[index].time).toBeGreaterThan(samples[index - 1].time)
    }
  })
})
