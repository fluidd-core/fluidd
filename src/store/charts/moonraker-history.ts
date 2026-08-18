import { chartBufferColumn, commitChartSamples, createChartBuffer } from '@/util/chart-buffer'
import decimalRound from '@/util/decimal-round'
import type { ChartBuffer, ChartSample } from './types'

// Shared by the backlog load and the live notification so they can't drift.
export const moonrakerChartSample = (
  stat: Moonraker.ProcStats.MoonrakerStats
): ChartSample | undefined => (
  stat.cpu_usage > 100
    ? undefined
    : {
        time: stat.time * 1000,
        values: {
          load: decimalRound(stat.cpu_usage, 2)
        }
      }
)

// Moonraker's backlog outruns the chart; only the newest `retention` samples fit.
export const buildMoonrakerHistoryBuffer = (
  stats: readonly Moonraker.ProcStats.MoonrakerStats[],
  retention: number
): ChartBuffer => {
  const buffer = createChartBuffer(retention, ['load'])
  const { time } = buffer
  const load = chartBufferColumn(buffer, 'load')

  let count = 0

  for (let index = Math.max(0, stats.length - retention); index < stats.length; index++) {
    const sample = moonrakerChartSample(stats[index])

    if (!sample) {
      continue
    }

    time[count] = sample.time
    load[count] = sample.values.load

    count++
  }

  commitChartSamples(buffer, count)

  return buffer
}
