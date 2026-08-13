import type { ChartBuffer, ChartDataSource } from './chart-buffer'
import { chartBufferSource } from './chart-buffer'

// Trailing moving average over `windowSeconds`. NaN gaps stay gaps.
export const smoothChartSource = (
  buffer: ChartBuffer,
  columns: readonly string[],
  windowSeconds: number
): ChartDataSource => {
  const source = chartBufferSource(buffer)

  if (
    windowSeconds <= 0 ||
    buffer.count === 0 ||
    columns.length === 0
  ) return source

  const windowMs = windowSeconds * 1000
  const times = source.date
  const count = buffer.count
  const result: ChartDataSource = { ...source }

  for (const key of columns) {
    const values = source[key]

    if (!values) continue

    const smoothed = new Float64Array(count)
    let left = 0
    let sum = 0
    let sumCount = 0

    for (let index = 0; index < count; index++) {
      const value = values[index]

      if (!Number.isNaN(value)) {
        sum += value
        sumCount++
      }

      while (times[index] - times[left] >= windowMs) {
        const leftValue = values[left]

        if (!Number.isNaN(leftValue)) {
          sum -= leftValue
          sumCount--
        }

        left++
      }

      smoothed[index] = Number.isNaN(value) ? Number.NaN : sum / sumCount
    }

    result[key] = smoothed
  }

  return result
}
