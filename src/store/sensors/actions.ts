import { ActionTree } from 'vuex'
import { MoonrakerSensors, MoonrakerSensorsState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'

export const actions: ActionTree<MoonrakerSensorsState, RootState> = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async init () {
    SocketActions.serverSensorsList()
  },

  async onSensorsList ({ commit }, payload: { sensors: MoonrakerSensors }) {
    if (payload) {
      commit('setSensorsList', payload)
    }
  },

  async onSensorUpdate ({ commit }, payload: MoonrakerSensors) {
    if (payload) {
      commit('setSensorUpdate', payload)
    }
  }
}
