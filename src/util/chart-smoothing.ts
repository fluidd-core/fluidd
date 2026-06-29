import type { ChartData } from '@/store/charts/types'

/**
 * Matches the spiky PWM-driven series (heater power, fan speed). These are the
 * only series we visually smooth — temperatures are left raw so real thermal
 * lag stays visible.
 */
export const isPowerOrSpeed = (key: string): boolean =>
  key.endsWith('#power') || key.endsWith('#speed')

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
  if (windowSeconds <= 0 || data.length === 0) return data

  const windowMs = windowSeconds * 1000

  // The smoothable keys present anywhere in the dataset.
  const keys = new Set<string>()
  for (const sample of data) {
    for (const key of Object.keys(sample)) {
      if (key !== 'date' && isSmoothable(key)) keys.add(key)
    }
  }
  if (keys.size === 0) return data

  return data.map((sample, i) => {
    const result: ChartData = { ...sample }
    const time = sample.date.getTime()

    for (const key of keys) {
      // Only smooth samples that actually carry a numeric value for this key.
      if (typeof sample[key] !== 'number') continue

      let sum = 0
      let count = 0
      for (let j = i; j >= 0; j--) {
        if (time - data[j].date.getTime() >= windowMs) break
        const value = data[j][key]
        if (typeof value === 'number') {
          sum += value
          count++
        }
      }

      if (count > 0) result[key] = sum / count
    }

    return result
  })
}
