import { commitChartSamples, createChartBuffer } from '@/util/chart-buffer'
import decimalRound from '@/util/decimal-round'
import type { ChartBuffer } from './types'
import type { ThermalSubKey } from './thermal-columns'
import { thermalColumn } from './thermal-columns'

const historyFields = [
  ['temperatures', undefined],
  ['targets', 'target'],
  ['powers', 'power'],
  ['speeds', 'speed']
] as const satisfies readonly (readonly [keyof Moonraker.DataStore.TemperatureStoreEntry, ThermalSubKey | undefined])[]

// Moonraker reports targets for these even though they have none.
const noTargetPrefixes = [
  'temperature_probe',
  'temperature_sensor'
]

interface ColumnSource {
  column: string;
  values: readonly number[];
}

// Sources are right-aligned on a 1Hz timeline ending at `endTime`, so a sensor
// with less history than the others reads NaN before its first sample.
export const buildThermalHistoryBuffer = (
  payload: Moonraker.DataStore.TemperatureStoreResponse,
  chartableSensors: readonly string[],
  retention: number,
  endTime: number
): ChartBuffer => {
  const sources: ColumnSource[] = []
  let count = 0

  for (const key of chartableSensors) {
    const entry = payload?.[key]

    if (!entry) continue

    const noTargets = noTargetPrefixes.some(prefix => key.startsWith(prefix))

    for (const [field, sub] of historyFields) {
      if (sub === 'target' && noTargets) continue

      const values = entry[field]

      if (!values?.length) continue

      count = Math.max(count, Math.min(values.length, retention))

      sources.push({
        column: thermalColumn(key, sub),
        values
      })
    }
  }

  const buffer = createChartBuffer(retention, sources.map(source => source.column))

  for (let i = 0; i < count; i++) {
    buffer.time[i] = endTime - (1000 * (count - i))
  }

  for (const { column, values } of sources) {
    const target = buffer.columns[column]
    const length = Math.min(values.length, count)
    const from = values.length - length
    const to = count - length

    for (let i = 0; i < length; i++) {
      target[to + i] = decimalRound(values[from + i], 2)
    }
  }

  commitChartSamples(buffer, count)

  return buffer
}
