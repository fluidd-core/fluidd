import type { ActionTree, Commit } from 'vuex'
import type { ChartData } from '../charts/types'
import type { MoonrakerSensorsState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'

const SENSOR_CHART_STORAGE_KEY = 'fluidd:sensorCharts'
const getSensorChartKey = (sensorId: string): string => `sensor:${sensorId}`

const getNumericSensorValues = (values: Moonraker.Sensor.Values): Record<string, number> => {
  return Object.fromEntries(
    Object.entries(values)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
  )
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value != null &&
  typeof value === 'object' &&
  !Array.isArray(value)
)

const getSensorChartCache = (): Record<string, ChartData[]> => {
  try {
    const item = localStorage.getItem(SENSOR_CHART_STORAGE_KEY)
    const parsed: unknown = item != null ? JSON.parse(item) : {}

    if (!isRecord(parsed)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed)
        .filter((entry): entry is [string, unknown[]] => Array.isArray(entry[1]))
        .map(([key, entries]) => [
          key,
          entries
            .filter(isRecord)
            .map((entry) => {
              const date = new Date(entry.date as string | number | Date)

              return Object.fromEntries(
                Object.entries(entry)
                  .filter(([entryKey, value]) => entryKey === 'date' || typeof value === 'number')
                  .map(([entryKey, value]) => [
                    entryKey,
                    entryKey === 'date' ? date : value
                  ])
              ) as ChartData
            })
            .filter(entry => !Number.isNaN(entry.date.valueOf()))
        ])
    )
  } catch {
    return {}
  }
}

const setSensorChartCache = (cache: Record<string, ChartData[]>) => {
  try {
    localStorage.setItem(SENSOR_CHART_STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage failures; live charting should keep working without persistence.
  }
}

const saveSensorChartEntry = (key: string, data: ChartData, retention: number) => {
  const cache = getSensorChartCache()
  const entries = [
    ...(cache[key] ?? []),
    data
  ]
    .filter(entry => (Date.now() - entry.date.valueOf()) / 1000 < retention)

  setSensorChartCache({
    ...cache,
    [key]: entries
  })
}

const restoreSensorChartEntries = (sensorIds: string[], commit: Commit, retention: number) => {
  const cache = getSensorChartCache()
  const sensorChartKeys = sensorIds.map(getSensorChartKey)
  const nextCache: Record<string, ChartData[]> = {}

  for (const [key, entries] of Object.entries(cache)) {
    if (!sensorChartKeys.includes(key)) {
      continue
    }

    const retainedEntries = entries
      .filter(entry => (Date.now() - entry.date.valueOf()) / 1000 < retention)

    nextCache[key] = retainedEntries

    for (const entry of retainedEntries) {
      commit('charts/setChartEntry', {
        type: key,
        retention,
        data: entry
      }, { root: true })
    }
  }

  setSensorChartCache(nextCache)
}

const addSensorChartEntries = (
  sensors: Record<string, Moonraker.Sensor.Values>,
  commit: Commit,
  retention: number
) => {
  for (const [sensorId, values] of Object.entries(sensors)) {
    const sensorValues = getNumericSensorValues(values)

    if (Object.keys(sensorValues).length === 0) {
      continue
    }

    const data: ChartData = {
      date: new Date(),
      ...sensorValues
    }

    commit('charts/setChartEntry', {
      type: getSensorChartKey(sensorId),
      retention,
      data
    }, { root: true })

    saveSensorChartEntry(getSensorChartKey(sensorId), data, retention)
  }
}

export const actions = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async init () {
    SocketActions.serverSensorsList()
  },

  async onSensorsList ({ commit, rootGetters }, payload: Moonraker.Sensor.ListResponse) {
    if (payload) {
      commit('setSensorsList', payload)
      restoreSensorChartEntries(
        Object.keys(payload.sensors),
        commit,
        rootGetters['charts/getChartRetention']
      )
      addSensorChartEntries(
        Object.fromEntries(
          Object.entries(payload.sensors)
            .map(([sensorId, sensor]) => [sensorId, sensor.values])
        ),
        commit,
        rootGetters['charts/getChartRetention']
      )
    }
  },

  async onSensorUpdate ({ commit, rootGetters, state }, payload: Record<string, Moonraker.Sensor.Values>) {
    if (payload) {
      commit('setSensorUpdate', payload)
      addSensorChartEntries(
        Object.fromEntries(
          Object.keys(payload)
            .map(sensorId => [sensorId, state.sensors[sensorId]?.values ?? payload[sensorId]])
        ),
        commit,
        rootGetters['charts/getChartRetention']
      )
    }
  }
} satisfies ActionTree<MoonrakerSensorsState, RootState>
