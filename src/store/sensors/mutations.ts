import Vue from 'vue'
import type { MutationTree } from 'vuex'
import type { MoonrakerSensors, MoonrakerSensorsState } from './types'
import { defaultState } from './state'

export const mutations = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setSensorsList (state, payload: { sensors: MoonrakerSensors }) {
    state.sensors = payload.sensors
  },

  setSensorUpdate (state, payload: MoonrakerSensors) {
    for (const sensorKey in payload) {
      Vue.set(state.sensors[sensorKey], 'values', payload[sensorKey])
    }
  }
} satisfies MutationTree<MoonrakerSensorsState>
