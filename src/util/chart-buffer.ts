import { markRaw } from 'vue'
import type { ChartBuffer, ChartDataSource, ChartSample } from '@/store/charts/types'

const emptyChartSource: ChartDataSource = Object.freeze({ date: [] })

const MIN_SLACK = 64

// Retention seconds is only a first guess - `compact` grows past 1Hz.
const capacityFor = (samples: number): number =>
  samples + Math.max(MIN_SLACK, samples >> 3)

// Vue's deep watcher walks `Object.keys` over every element - `markRaw` skips it.
const allocate = (capacity: number): Float64Array =>
  markRaw(new Float64Array(capacity))

const createColumn = (capacity: number, from = 0): Float64Array =>
  allocate(capacity).fill(Number.NaN, from)

export const createChartBuffer = (
  retention: number,
  columns: readonly string[] = []
): ChartBuffer => {
  const capacity = capacityFor(retention)

  const buffer: ChartBuffer = {
    time: allocate(capacity),
    columns: new Map(),
    offset: 0,
    count: 0,
    retention,
    revision: 0
  }

  for (const column of columns) {
    buffer.columns.set(column, createColumn(capacity))
  }

  return buffer
}

// Column names are runtime sensor ids, so misses are expected, not exceptional.
export const chartBufferColumn = (buffer: ChartBuffer, key: string): Float64Array => {
  let column = buffer.columns.get(key)

  if (!column) {
    column = createColumn(buffer.time.length)

    buffer.columns.set(key, column)
  }

  return column
}

const reallocate = (
  buffer: ChartBuffer,
  capacity: number,
  start: number,
  count: number
): void => {
  const time = allocate(capacity)

  time.set(buffer.time.subarray(start, start + count))

  buffer.time = time

  for (const [key, values] of buffer.columns) {
    const column = createColumn(capacity, count)

    column.set(values.subarray(start, start + count))

    buffer.columns.set(key, column)
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

  for (const column of buffer.columns.values()) {
    column.copyWithin(0, offset, offset + count)
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

// `revision` is the change signal - Vue 2 doesn't observe typed array writes,
// nor a `Map`, so nothing here needs to go through `Vue.set`. One bump per batch.
export const appendChartSamples = (buffer: ChartBuffer, samples: readonly ChartSample[]): void => {
  if (samples.length === 0) {
    return
  }

  for (const { time, values } of samples) {
    if (buffer.offset + buffer.count >= buffer.time.length) {
      compact(buffer)
    }

    const index = buffer.offset + buffer.count

    for (const key in values) {
      chartBufferColumn(buffer, key)
    }

    for (const [key, column] of buffer.columns) {
      column[index] = values[key] ?? Number.NaN
    }

    buffer.time[index] = time
    buffer.count++

    dropExpired(buffer, time)
  }

  buffer.revision++
}

// Publishes `count` samples written directly into `time` and `columns`.
export const commitChartSamples = (buffer: ChartBuffer, count: number): void => {
  buffer.offset = 0
  buffer.count = Math.min(count, buffer.time.length)
  buffer.revision++
}

// Retention is a time window, not a sample count - `dropExpired` trims.
export const resizeChartBuffer = (buffer: ChartBuffer, retention: number): void => {
  if (retention === buffer.retention) return

  const capacity = Math.max(capacityFor(retention), capacityFor(buffer.count))

  reallocate(buffer, capacity, buffer.offset, buffer.count)

  buffer.retention = retention
  buffer.revision++
}

const sourceCache = new WeakMap<ChartBuffer, { revision: number; source: ChartDataSource }>()

// `date` must come first - ECharts derives the row count from column 0.
export const chartBufferSource = (buffer?: ChartBuffer): ChartDataSource => {
  if (!buffer) {
    return emptyChartSource
  }

  const cached = sourceCache.get(buffer)

  if (
    cached &&
    cached.revision === buffer.revision
  ) {
    return cached.source
  }

  const { time, offset, count, columns } = buffer

  const source: ChartDataSource = {
    date: time.subarray(offset, offset + count)
  }

  for (const [key, column] of columns) {
    source[key] = column.subarray(offset, offset + count)
  }

  sourceCache.set(buffer, { revision: buffer.revision, source })

  return source
}

export const chartBufferLastValue = (buffer: ChartBuffer | undefined, column: string): number | undefined => {
  if (!buffer?.count) {
    return undefined
  }

  return buffer.columns.get(column)?.[buffer.offset + buffer.count - 1]
}

export const chartBufferLastTime = (buffer: ChartBuffer | undefined): number | undefined => {
  if (!buffer?.count) {
    return undefined
  }

  return buffer.time[buffer.offset + buffer.count - 1]
}

const RATE_OF_CHANGE_WINDOW = 5

// Trailing units/sec, scanning back from the last sample to the first gap.
export const chartBufferRateOfChange = (buffer: ChartBuffer, column: string): number => {
  const values = buffer.columns.get(column)

  if (
    !values ||
    buffer.count === 0
  ) {
    return 0
  }

  const last = buffer.offset + buffer.count - 1

  if (Number.isNaN(values[last])) {
    return 0
  }

  const start = buffer.offset + Math.max(0, buffer.count - RATE_OF_CHANGE_WINDOW)
  let first = last

  while (first > start && !Number.isNaN(values[first - 1])) {
    first--
  }

  if (
    first === last ||
    buffer.time[last] === buffer.time[first]
  ) {
    return 0
  }

  const rate = (values[last] - values[first]) / (buffer.time[last] - buffer.time[first]) * 1000

  return Math.abs(rate) < 0.05
    ? 0
    : rate
}
