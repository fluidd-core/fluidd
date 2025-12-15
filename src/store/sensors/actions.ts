import type { ActionTree } from 'vuex'
import type { MoonrakerSensorsState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'

export const actions = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async init () {
    SocketActions.serverSensorsList()
  },

  async onSensorsList ({ commit }, payload: { sensors: Moonraker.Sensor.ListResponse }) {
    if (payload) {
      commit('setSensorsList', payload)
    }
  },

  async onSensorUpdate ({ commit }, payload: Record<string, Moonraker.Sensor.Entry>) {
    if (payload) {
      commit('setSensorUpdate', payload)
    }
  }
} satisfies ActionTree<MoonrakerSensorsState, RootState>
