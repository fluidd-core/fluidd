import { commitChartSamples, createChartBuffer } from '@/util/chart-buffer'
import decimalRound from '@/util/decimal-round'
import type { ChartBuffer } from './types'

// Moonraker's backlog outruns the chart; only the newest `retention` samples fit.
export const buildMoonrakerHistoryBuffer = (
  stats: readonly Moonraker.ProcStats.MoonrakerStats[],
  retention: number
): ChartBuffer => {
  const buffer = createChartBuffer(retention, ['load'])
  const { time, columns: { load } } = buffer

  let count = 0

  for (let index = Math.max(0, stats.length - retention); index < stats.length; index++) {
    const stat = stats[index]

    if (stat.cpu_usage > 100) {
      continue
    }

    time[count] = stat.time * 1000
    load[count] = decimalRound(stat.cpu_usage, 2)

    count++
  }

  commitChartSamples(buffer, count)

  return buffer
}
