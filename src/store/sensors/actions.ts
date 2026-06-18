import type { ActionTree } from 'vuex'
import type { MoonrakerSensorsState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { handleSensorsChange } from '../chart_helpers'

export const actions = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async init () {
    SocketActions.serverSensorsList()
    SocketActions.serverSensorsMeasurements()
  },

  async onSensorsList ({ commit }, payload: Moonraker.Sensor.ListResponse) {
    if (payload) {
      commit('setSensorsList', payload)
    }
  },

  async onSensorUpdate ({ commit, rootGetters }, payload: Record<string, Moonraker.Sensor.Values>) {
    if (payload) {
      commit('setSensorUpdate', payload)
      handleSensorsChange(payload, commit, rootGetters)
    }
  }
} satisfies ActionTree<MoonrakerSensorsState, RootState>
