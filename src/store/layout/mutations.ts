import Vue from 'vue'
import { MutationTree } from 'vuex'
import { defaultState } from './'
import { LayoutConfig, LayoutState, Layouts } from './types'

export const mutations: MutationTree<LayoutState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setInitLayout (state, payload) {
    if (payload) {
      if (payload) Object.assign(state, payload)
    }
  },

  setLayoutChange (state, payload: { name: string; value: Layouts }) {
    Vue.set(state.layouts, payload.name, payload.value)
  },

  /**
   * Updates a layout config item.
   */
  setUpdateConfig (state, payload: { name: string; container: string; i: number; value: LayoutConfig }) {
    Vue.set(state.layouts[payload.name][payload.container], payload.i, payload.value)
  }
}
