import type { MutationTree } from 'vuex'
import type { MoonrakerSensorsState } from './types'
import { defaultState } from './state'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setSensorsList (state, payload: Moonraker.Sensor.ListResponse) {
    for (const sensorKey in payload.sensors) {
      payload.sensors[sensorKey].values = Object.freeze(payload.sensors[sensorKey].values)
    }
    state.sensors = payload.sensors
  },

  setSensorUpdate (state, payload: Record<string, Moonraker.Sensor.Values>) {
    for (const sensorKey in payload) {
      state.sensors[sensorKey].values = Object.freeze(payload[sensorKey])
    }
  }
} satisfies MutationTree<MoonrakerSensorsState>
