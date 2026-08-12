import type { ChartData } from '@/store/charts/types'

/**
 * Applies a trailing time-window moving average to every smoothable key,
 * returning a new dataset. The input is never mutated.
 *
 * `windowSeconds` is the width of the trailing window in seconds; Moonraker's
 * store is ~1 sample/second, so a 3s window averages roughly the last 3
 * samples. A window of 0 (or no smoothable keys) is a no-op and returns the
 * original array reference unchanged.
 *
 * Samples missing a numeric value for a key are skipped in the mean, and a
 * sample that has no value for a key keeps it absent (a value is never
 * invented).
 */
export const smoothChartData = (
  data: ChartData[],
  windowSeconds: number,
  isSmoothable: (key: string) => boolean
): ChartData[] => {
  if (!Number.isFinite(windowSeconds) || windowSeconds <= 0 || data.length === 0) return data

  const windowMs = windowSeconds * 1000

  // The smoothable keys present anywhere in the dataset.
  const keys = new Set<string>()
  for (const sample of data) {
    for (const key of Object.keys(sample)) {
      if (key !== 'date' && isSmoothable(key)) keys.add(key)
    }
  }
  if (keys.size === 0) return data

  const times = data.map(sample => sample.date.getTime())
  const result: ChartData[] = [...data]

  // Two-pointer trailing window per key.
  for (const key of keys) {
    let left = 0
    let sum = 0
    let count = 0

    for (let i = 0; i < data.length; i++) {
      const value = data[i][key]
      if (typeof value === 'number') {
        sum += value
        count++
      }

      while (times[i] - times[left] >= windowMs) {
        const leftValue = data[left][key]
        if (typeof leftValue === 'number') {
          sum -= leftValue
          count--
        }
        left++
      }

      // Only smooth samples that actually carry a numeric value for this key.
      if (typeof value === 'number' && count > 0) {
        if (result[i] === data[i]) result[i] = { ...data[i] }
        result[i][key] = sum / count
      }
    }
  }

  return result
}
