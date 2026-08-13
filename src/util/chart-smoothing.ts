import type { ChartData } from '@/store/charts/types'

/**
 * Applies a trailing moving average (window in seconds) to each key in
 * `keys`, returning a new dataset — the input is never mutated. A window of
 * 0 (or an empty `keys` list) is a no-op returning the original reference.
 * Samples missing a numeric value are skipped in the mean and left absent.
 */
export const smoothChartData = (
  data: ChartData[],
  keys: readonly string[],
  windowSeconds: number
): ChartData[] => {
  if (
    windowSeconds <= 0 ||
    data.length === 0 ||
    keys.length === 0
  ) return data

  const windowMs = windowSeconds * 1000
  const times = data
    .map(sample => sample.date.getTime())
  const result = [...data]

  // Two-pointer trailing window per key.
  for (const key of keys) {
    let left = 0
    let sum = 0
    let count = 0

    for (let index = 0; index < data.length; index++) {
      const value = data[index][key]

      if (typeof value === 'number') {
        sum += value
        count++
      }

      while (times[index] - times[left] >= windowMs) {
        const leftValue = data[left][key]

        if (typeof leftValue === 'number') {
          sum -= leftValue
          count--
        }

        left++
      }

      // Only smooth samples that actually carry a numeric value for this key.
      if (typeof value === 'number' && count > 0) {
        if (result[index] === data[index]) {
          result[index] = {
            ...data[index]
          }
        }

        result[index][key] = sum / count
      }
    }
  }

  return result
}
