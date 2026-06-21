import type { ActionTree } from 'vuex'
import type { MoonrakerSensorsState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'

export const actions = {
  async reset ({ commit }) {
    commit('setReset')
  },

  async init () {
    SocketActions.serverSensorsList()
  },

  initSensors ({ commit }, payload: Partial<MoonrakerSensorsState>) {
    commit('setInitSensors', payload)
  },

  saveExpanded ({ commit, state }, expanded: string[]) {
    commit('setExpanded', expanded)

    SocketActions.serverDatabasePostItem(Globals.MOONRAKER_DB.fluidd.ROOTS.sensors.name + '.expanded', state.expanded)
  },

  async onSensorsList ({ commit }, payload: Moonraker.Sensor.ListResponse) {
    if (payload) {
      commit('setSensorsList', payload)
    }
  },

  async onSensorUpdate ({ commit }, payload: Record<string, Moonraker.Sensor.Values>) {
    if (payload) {
      commit('setSensorUpdate', payload)
    }
  }
} satisfies ActionTree<MoonrakerSensorsState, RootState>
