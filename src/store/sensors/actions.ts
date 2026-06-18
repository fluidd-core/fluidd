import type { ActionTree, Commit } from 'vuex'
import type { ChartData } from '../charts/types'
import type { MoonrakerSensorsState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'

const getSensorChartKey = (sensorId: string): string => `sensor:${sensorId}`

const getNumericSensorValues = (values: Moonraker.Sensor.Values): Record<string, number> => {
  return Object.fromEntries(
    Object.entries(values)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
  )
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
