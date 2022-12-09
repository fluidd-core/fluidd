import { ActionTree } from 'vuex'
import { LayoutConfig, LayoutState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'

export const actions: ActionTree<LayoutState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async initLayout ({ commit }, payload) {
    commit('setInitLayout', payload)
  },

  async onLayoutChange ({ commit, state }, payload: { name: string; value: LayoutConfig }) {
    const layout = state.layouts[payload.name]
    if (layout || payload.name.startsWith('dashboard')) {
      commit('setLayoutChange', payload)
      await SocketActions.serverWrite(
        Globals.MOONRAKER_DB.fluidd.ROOTS.layout.name + '.layouts',
        state.layouts
      )
    }
  },

  async onUpdateConfig ({ commit, state, dispatch }, payload: { name: string; value: LayoutConfig }) {
    let containers = state.layouts[payload.name]
    if (!containers) {
      // user/device specific layout doesn't exist yet, so we create it
      dispatch('onLayoutChange', { name: payload.name, value: state.layouts.dashboard })
      containers = state.layouts[payload.name]
    }

    if (containers) {
      for (const container in containers) {
        const i = containers[container].findIndex(layout => layout.id === payload.value.id)
        if (i >= 0) {
          commit('setUpdateConfig', { name: payload.name, container, i, value: payload.value })
          await SocketActions.serverWrite(
            Globals.MOONRAKER_DB.fluidd.ROOTS.layout.name + `.layouts.${payload.name}.${container}`,
            state.layouts[payload.name][container]
          )
        }
      }
    }
  }
}
