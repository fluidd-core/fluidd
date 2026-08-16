import { markRaw } from 'vue'
import type { ChartBuffer, ChartDataSource } from '@/store/charts/types'

const emptyChartSource: ChartDataSource = Object.freeze({ date: [] })

const MIN_SLACK = 64

const capacityFor = (retention: number): number =>
  retention + Math.max(MIN_SLACK, retention >> 3)

// Vue's deep watcher walks `Object.keys` over every element - `markRaw` skips it.
const createTimeColumn = (capacity: number): Float64Array =>
  markRaw(new Float64Array(capacity))

const createColumn = (capacity: number): Float64Array =>
  createTimeColumn(capacity).fill(Number.NaN)

export const createChartBuffer = (
  retention: number,
  columns: readonly string[] = []
): ChartBuffer => {
  const capacity = capacityFor(retention)

  const buffer: ChartBuffer = {
    time: createTimeColumn(capacity),
    columns: {},
    offset: 0,
    count: 0,
    retention,
    revision: 0
  }

  for (const column of columns) {
    buffer.columns[column] = createColumn(capacity)
  }

  return buffer
}

const reallocate = (
  buffer: ChartBuffer,
  capacity: number,
  start: number,
  count: number
): void => {
  const time = createTimeColumn(capacity)
  time.set(buffer.time.subarray(start, start + count))
  buffer.time = time

  for (const key in buffer.columns) {
    const column = createColumn(capacity)
    column.set(buffer.columns[key].subarray(start, start + count))
    buffer.columns[key] = column
  }

  buffer.offset = 0
  buffer.count = count
}

const compact = (buffer: ChartBuffer): void => {
  const { offset, count } = buffer

  if (offset === 0) {
    // Samples arriving faster than `retention` expires them.
    reallocate(buffer, buffer.time.length * 2, offset, count)
    return
  }

  buffer.time.copyWithin(0, offset, offset + count)

  for (const key in buffer.columns) {
    buffer.columns[key].copyWithin(0, offset, offset + count)
  }

  buffer.offset = 0
}

// Binary search assumes `time` is monotonically non-decreasing.
const dropExpired = (buffer: ChartBuffer, now: number): void => {
  const cutoff = now - (buffer.retention * 1000)
  const { time, offset, count } = buffer

  if (count === 0 || time[offset] > cutoff) return

  let lo = offset
  let hi = offset + count

  while (lo < hi) {
    const mid = (lo + hi) >>> 1

    if (time[mid] > cutoff) {
      hi = mid
    } else {
      lo = mid + 1
    }
  }

  buffer.offset = lo
  buffer.count -= lo - offset
}

// `revision` is the change signal - Vue 2 doesn't observe typed array writes.
// `defineColumn` lets the store layer add columns reactively (`Vue.set`).
export const appendChartSample = (
  buffer: ChartBuffer,
  time: number,
  values: Readonly<Record<string, number>>,
  defineColumn?: (columns: Record<string, Float64Array>, key: string, column: Float64Array) => void
): void => {
  if (buffer.offset + buffer.count >= buffer.time.length) {
    compact(buffer)
  }

  const index = buffer.offset + buffer.count

  for (const key in values) {
    if (!(key in buffer.columns)) {
      const column = createColumn(buffer.time.length)

      if (defineColumn) {
        defineColumn(buffer.columns, key, column)
      } else {
        buffer.columns[key] = column
      }
    }
  }

  for (const key in buffer.columns) {
    buffer.columns[key][index] = values[key] ?? Number.NaN
  }

  buffer.time[index] = time
  buffer.count++

  dropExpired(buffer, time)

  buffer.revision++
}

// Keeps as much of the live window as the new retention still fits.
export const resizeChartBuffer = (buffer: ChartBuffer, retention: number): void => {
  if (retention === buffer.retention) return

  const liveCount = Math.min(buffer.count, retention)

  reallocate(buffer, capacityFor(retention), buffer.offset + buffer.count - liveCount, liveCount)

  buffer.retention = retention
  buffer.revision++
}

const sourceCache = new WeakMap<ChartBuffer, { revision: number; source: ChartDataSource }>()

// `date` must come first - ECharts derives the row count from column 0.
export const chartBufferSource = (buffer?: ChartBuffer): ChartDataSource => {
  if (!buffer) return emptyChartSource

  const cached = sourceCache.get(buffer)

  if (cached && cached.revision === buffer.revision) {
    return cached.source
  }

  const { time, offset, count, columns } = buffer

  const source: ChartDataSource = {
    date: time.subarray(offset, offset + count)
  }

  for (const key in columns) {
    source[key] = columns[key].subarray(offset, offset + count)
  }

  sourceCache.set(buffer, { revision: buffer.revision, source })

  return source
}

export const chartBufferLastValue = (buffer: ChartBuffer, column: string): number | undefined => {
  if (buffer.count === 0) return undefined

  return buffer.columns[column]?.[buffer.offset + buffer.count - 1]
}

export const chartBufferLastTime = (buffer: ChartBuffer): number | undefined => {
  if (buffer.count === 0) return undefined

  return buffer.time[buffer.offset + buffer.count - 1]
}

const RATE_OF_CHANGE_WINDOW = 5

// Trailing units/sec, scanning back from the last sample to the first gap.
export const chartBufferRateOfChange = (buffer: ChartBuffer, column: string): number => {
  const values = buffer.columns[column]

  if (!values || buffer.count === 0) return 0

  const start = Math.max(0, buffer.count - RATE_OF_CHANGE_WINDOW)
  let first = -1
  let last = -1

  for (let i = buffer.count - 1; i >= start; i--) {
    const index = buffer.offset + i

    if (Number.isNaN(values[index])) break

    if (last === -1) last = index
    first = index
  }

  if (last === -1 || first === last) return 0

  const rate = (values[last] - values[first]) / (buffer.time[last] - buffer.time[first]) * 1000

  return Math.abs(rate) < 0.05 ? 0 : rate
}
