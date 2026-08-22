import decimalRound from '@/util/decimal-round'
import type { ChartSample } from './types'

const moonrakerChartSample = (
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

// `machine.proc_stats` re-runs on reconnect; re-appending would unsort `time`.
export const moonrakerChartSamples = (
  stats: readonly Moonraker.ProcStats.MoonrakerStats[],
  after: number
): ChartSample[] => {
  const samples: ChartSample[] = []

  for (const stat of stats) {
    const sample = moonrakerChartSample(stat)

    if (sample && sample.time > after) {
      samples.push(sample)
    }
  }

  return samples
}
