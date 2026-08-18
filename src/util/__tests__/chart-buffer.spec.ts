import {
  appendChartSample,
  chartBufferColumn,
  chartBufferLastTime,
  chartBufferLastValue,
  chartBufferRateOfChange,
  chartBufferSource,
  commitChartSamples,
  createChartBuffer,
  resizeChartBuffer
} from '../chart-buffer'

// Appends `count` samples 1s apart starting at `startMs`, one value per key
// (all keys share the same value at a given sample index).
const fill = (
  buffer: ReturnType<typeof createChartBuffer>,
  count: number,
  keys: readonly string[],
  startMs = 0,
  stepMs = 1000
): void => {
  for (let i = 0; i < count; i++) {
    const values: Record<string, number> = {}
    keys.forEach(key => { values[key] = i })
    appendChartSample(buffer, startMs + (i * stepMs), values)
  }
}

describe('chart-buffer', () => {
  describe('createChartBuffer', () => {
    it('pre-creates known columns, NaN-filled', () => {
      const buffer = createChartBuffer(10, ['load', 'awake'])

      expect([...buffer.columns.keys()]).toEqual(['load', 'awake'])
      expect(buffer.count).toBe(0)
      expect(chartBufferColumn(buffer, 'load').every(Number.isNaN)).toBe(true)
    })

    it('treats a `__proto__` column as an ordinary key', () => {
      // Computed, so it lands as a key rather than the literal's setter.
      const protoKey = '__proto__'
      const buffer = createChartBuffer(600)

      appendChartSample(buffer, 1000, { [protoKey]: 42 })

      expect([...buffer.columns.keys()]).toEqual([protoKey])
      expect(Array.from(chartBufferColumn(buffer, protoKey).subarray(0, 1))).toEqual([42])
    })
  })

  describe('appendChartSample', () => {
    it('appends and reads back exact values', () => {
      const buffer = createChartBuffer(600, ['load'])

      appendChartSample(buffer, 1000, { load: 42 })
      appendChartSample(buffer, 2000, { load: 43 })

      const source = chartBufferSource(buffer)

      expect(Array.from(source.date)).toEqual([1000, 2000])
      expect(Array.from(source.load)).toEqual([42, 43])
    })

    it('creates a column lazily and backfills earlier samples as NaN', () => {
      const buffer = createChartBuffer(600)

      appendChartSample(buffer, 1000, { extruder: 200 })
      appendChartSample(buffer, 2000, { extruder: 201 })
      appendChartSample(buffer, 3000, { extruder: 202, 'extruder#target': 210 })

      const source = chartBufferSource(buffer)

      expect([...buffer.columns.keys()]).toEqual(['extruder', 'extruder#target'])
      expect(Array.from(source['extruder#target'])).toEqual([Number.NaN, Number.NaN, 210])
    })

    it('leaves a column absent from a sample as a gap (NaN), not carried forward', () => {
      const buffer = createChartBuffer(600, ['load', 'awake'])

      appendChartSample(buffer, 1000, { load: 1, awake: 2 })
      appendChartSample(buffer, 2000, { load: 3 })

      const source = chartBufferSource(buffer)

      expect(Array.from(source.awake)).toEqual([2, Number.NaN])
    })

    it('drops samples older than the retention window', () => {
      const buffer = createChartBuffer(3, ['load'])

      fill(buffer, 6, ['load'])

      const source = chartBufferSource(buffer)

      // now = 5000ms, cutoff = 5000 - 3000 = 2000ms; samples strictly after
      // the cutoff survive - matches the pre-refactor `(now - date) / 1000 <
      // retention` semantics.
      expect(Array.from(source.date)).toEqual([3000, 4000, 5000])
      expect(Array.from(source.load)).toEqual([3, 4, 5])
    })

    it('compacts correctly across the wrap point instead of overwriting live data', () => {
      const buffer = createChartBuffer(5, ['load'])
      const initialCapacity = buffer.time.length
      const total = initialCapacity + 20

      // Enough samples to force at least one compaction while only ever
      // keeping a 5s retention window alive.
      fill(buffer, total, ['load'])

      const source = chartBufferSource(buffer)

      expect(source.date.length).toBe(5)
      // With 1s spacing and a 5s retention, only the last 5 appended values
      // (by original append index) should still be live.
      expect(Array.from(source.load)).toEqual([total - 5, total - 4, total - 3, total - 2, total - 1])
    })

    it('grows capacity instead of dropping data when a burst outpaces retention', () => {
      const buffer = createChartBuffer(5, ['load'])
      const initialCapacity = buffer.time.length

      // All samples share the same timestamp, so nothing ever expires -
      // forces growth once the buffer fills up.
      fill(buffer, initialCapacity + 10, ['load'], 0, 0)

      expect(buffer.time.length).toBeGreaterThan(initialCapacity)
      expect(buffer.count).toBe(initialCapacity + 10)
      expect(chartBufferSource(buffer).date.length).toBe(initialCapacity + 10)
    })

    it('bumps revision on every append', () => {
      const buffer = createChartBuffer(600, ['load'])

      expect(buffer.revision).toBe(0)
      appendChartSample(buffer, 1000, { load: 1 })
      expect(buffer.revision).toBe(1)
      appendChartSample(buffer, 2000, { load: 2 })
      expect(buffer.revision).toBe(2)
    })
  })

  describe('commitChartSamples', () => {
    it('publishes samples written directly into the columns', () => {
      const buffer = createChartBuffer(600, ['load'])

      buffer.time.set([1000, 2000, 3000])
      chartBufferColumn(buffer, 'load').set([1, 2, 3])

      commitChartSamples(buffer, 3)

      expect(buffer.offset).toBe(0)
      expect(buffer.count).toBe(3)
      expect(buffer.revision).toBe(1)
      expect(Array.from(chartBufferSource(buffer).load)).toEqual([1, 2, 3])
    })

    it('clamps the count to the backing capacity', () => {
      const buffer = createChartBuffer(10)

      commitChartSamples(buffer, 10_000)

      expect(buffer.count).toBe(buffer.time.length)
    })

    it('resets a non-zero offset', () => {
      const buffer = createChartBuffer(600, ['load'])
      buffer.offset = 5

      commitChartSamples(buffer, 2)

      expect(buffer.offset).toBe(0)
    })
  })

  describe('resizeChartBuffer', () => {
    it('grows capacity while preserving the live window', () => {
      const buffer = createChartBuffer(3, ['load'])
      fill(buffer, 3, ['load'])

      resizeChartBuffer(buffer, 10)

      expect(buffer.retention).toBe(10)
      expect(Array.from(chartBufferSource(buffer).load)).toEqual([0, 1, 2])
    })

    it('shrinks capacity, trimming the oldest live samples', () => {
      const buffer = createChartBuffer(10, ['load'])
      fill(buffer, 5, ['load'])

      resizeChartBuffer(buffer, 2)

      expect(buffer.retention).toBe(2)
      expect(Array.from(chartBufferSource(buffer).load)).toEqual([3, 4])
    })

    it('is a no-op when retention is unchanged', () => {
      const buffer = createChartBuffer(10, ['load'])
      fill(buffer, 5, ['load'])
      const revision = buffer.revision

      resizeChartBuffer(buffer, 10)

      expect(buffer.revision).toBe(revision)
    })
  })

  describe('chartBufferSource', () => {
    it('puts date first, so ECharts derives the row count from it', () => {
      const buffer = createChartBuffer(600, ['load'])
      appendChartSample(buffer, 1000, { load: 1 })

      expect(Object.keys(chartBufferSource(buffer))[0]).toBe('date')
    })

    it('reuses the same view when revision is unchanged', () => {
      const buffer = createChartBuffer(600, ['load'])
      appendChartSample(buffer, 1000, { load: 1 })

      expect(chartBufferSource(buffer)).toBe(chartBufferSource(buffer))
    })

    it('returns a fresh view after a further append', () => {
      const buffer = createChartBuffer(600, ['load'])
      appendChartSample(buffer, 1000, { load: 1 })
      const first = chartBufferSource(buffer)

      appendChartSample(buffer, 2000, { load: 2 })

      expect(chartBufferSource(buffer)).not.toBe(first)
    })

    it('returns a plain object', () => {
      const buffer = createChartBuffer(600, ['extruder'])
      appendChartSample(buffer, 1000, { extruder: 1 })

      // zrender's `clone` calls `source.hasOwnProperty` while cloning the option.
      expect(Object.getPrototypeOf(chartBufferSource(buffer))).toBe(Object.prototype)
    })
  })

  describe('chartBufferLastValue', () => {
    it('returns undefined for an empty buffer', () => {
      const buffer = createChartBuffer(600, ['load'])
      expect(chartBufferLastValue(buffer, 'load')).toBeUndefined()
    })

    it('returns the most recently appended value', () => {
      const buffer = createChartBuffer(600, ['load'])
      appendChartSample(buffer, 1000, { load: 1 })
      appendChartSample(buffer, 2000, { load: 2 })

      expect(chartBufferLastValue(buffer, 'load')).toBe(2)
    })
  })

  describe('chartBufferLastTime', () => {
    it('returns undefined for an empty buffer', () => {
      const buffer = createChartBuffer(600, ['load'])
      expect(chartBufferLastTime(buffer)).toBeUndefined()
    })

    it('returns the most recently appended timestamp', () => {
      const buffer = createChartBuffer(600, ['load'])
      appendChartSample(buffer, 1000, { load: 1 })
      appendChartSample(buffer, 2000, { load: 2 })

      expect(chartBufferLastTime(buffer)).toBe(2000)
    })
  })

  describe('chartBufferRateOfChange', () => {
    it('returns 0 for an empty or unknown column', () => {
      const buffer = createChartBuffer(600, ['load'])
      expect(chartBufferRateOfChange(buffer, 'load')).toBe(0)
      expect(chartBufferRateOfChange(buffer, 'missing')).toBe(0)
    })

    it('returns 0 with fewer than 2 trailing values', () => {
      const buffer = createChartBuffer(600, ['load'])
      appendChartSample(buffer, 1000, { load: 5 })

      expect(chartBufferRateOfChange(buffer, 'load')).toBe(0)
    })

    it('computes units/sec over the trailing window', () => {
      const buffer = createChartBuffer(600, ['load'])
      fill(buffer, 5, ['load']) // values 0,1,2,3,4 at t=0,1000,...,4000

      // (4 - 0) / (4000 - 0) * 1000 = 1 unit/sec
      expect(chartBufferRateOfChange(buffer, 'load')).toBeCloseTo(1, 5)
    })

    it('stops at the first gap scanning back from the most recent sample', () => {
      const buffer = createChartBuffer(600, ['load'])
      appendChartSample(buffer, 0, { load: 0 })
      appendChartSample(buffer, 1000, {}) // gap
      appendChartSample(buffer, 2000, { load: 10 })
      appendChartSample(buffer, 3000, { load: 20 })

      // Trailing run is only [2000: 10, 3000: 20] - the gap at 1000 stops the scan.
      expect(chartBufferRateOfChange(buffer, 'load')).toBeCloseTo(10, 5)
    })

    it('returns 0 when the most recent sample itself is a gap', () => {
      const buffer = createChartBuffer(600, ['load'])
      appendChartSample(buffer, 0, { load: 0 })
      appendChartSample(buffer, 1000, { load: 10 })
      appendChartSample(buffer, 2000, {})

      expect(chartBufferRateOfChange(buffer, 'load')).toBe(0)
    })

    it('returns 0 when the trailing samples share a timestamp', () => {
      const buffer = createChartBuffer(600, ['load'])
      appendChartSample(buffer, 1000, { load: 0 })
      appendChartSample(buffer, 1000, { load: 50 })

      expect(chartBufferRateOfChange(buffer, 'load')).toBe(0)
    })

    it('flattens noise below 0.05 units/sec to 0', () => {
      const buffer = createChartBuffer(600, ['load'])
      appendChartSample(buffer, 0, { load: 0 })
      appendChartSample(buffer, 1000, { load: 0.01 })

      expect(chartBufferRateOfChange(buffer, 'load')).toBe(0)
    })
  })
})
