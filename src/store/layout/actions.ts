import { ActionTree } from 'vuex'
import { LayoutConfig, LayoutState } from './types'
import { RootState } from '../types'
import { SocketActions } from '@/socketActions'
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
    if (layout) {
      commit('setLayoutChange', payload)
      await SocketActions.serverWrite(
        Globals.MOONRAKER_DB.ROOTS.layout.name + '.layouts',
        state.layouts
      )
    }
  },

  async onUpdateConfig ({ commit, state }, payload: { name: string; value: LayoutConfig }) {
    const containers = state.layouts[payload.name]
    if (containers) {
      for (const container in containers) {
        const i = containers[container].findIndex(layout => layout.id === payload.value.id)
        if (i >= 0) {
          commit('setUpdateConfig', { name: payload.name, container, i, value: payload.value })
          console.log('saving config', state.layouts[payload.name][container])
          await SocketActions.serverWrite(
            Globals.MOONRAKER_DB.ROOTS.layout.name + `.layouts.${payload.name}.${container}`,
            state.layouts[payload.name][container]
          )
        }
      }
    }
  }
}
