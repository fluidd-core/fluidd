import { buildMoonrakerHistoryBuffer } from '../moonraker-history'
import { chartBufferSource } from '@/util/chart-buffer'

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

describe('buildMoonrakerHistoryBuffer', () => {
  it('converts timestamps to milliseconds and rounds load to 2 decimal places', () => {
    const buffer = buildMoonrakerHistoryBuffer(stats(3, index => 10.126 + index), 600)

    const source = chartBufferSource(buffer)

    expect(buffer.count).toBe(3)
    expect(Array.from(source.date)).toEqual([1_000_000, 1_001_000, 1_002_000])
    expect(Array.from(source.load)).toEqual([10.13, 11.13, 12.13])
  })

  it('keeps the newest samples when the backlog exceeds retention', () => {
    const buffer = buildMoonrakerHistoryBuffer(stats(1800, index => index % 100), 600)

    const source = chartBufferSource(buffer)

    expect(buffer.count).toBe(600)
    expect(source.date[0]).toBe(2_200_000)
    expect(source.date[599]).toBe(2_799_000)
    expect(source.load[0]).toBe(1200 % 100)
    expect(source.load[599]).toBe(1799 % 100)
  })

  it('skips out-of-range samples without leaving a gap', () => {
    const buffer = buildMoonrakerHistoryBuffer(
      stats(4, index => (index === 1 ? 4523.7 : index)),
      600
    )

    const source = chartBufferSource(buffer)

    expect(buffer.count).toBe(3)
    expect(Array.from(source.load)).toEqual([0, 2, 3])
    expect(Array.from(source.date)).toEqual([1_000_000, 1_002_000, 1_003_000])
  })

  it('yields a monotonically non-decreasing timeline', () => {
    const buffer = buildMoonrakerHistoryBuffer(stats(1800, index => index % 100), 600)

    const { date } = chartBufferSource(buffer)

    for (let index = 1; index < date.length; index++) {
      expect(date[index]).toBeGreaterThanOrEqual(date[index - 1])
    }
  })

  it('yields an empty buffer for an empty backlog', () => {
    const buffer = buildMoonrakerHistoryBuffer([], 600)

    expect(buffer.count).toBe(0)
    expect([...buffer.columns.keys()]).toEqual(['load'])
  })
})
