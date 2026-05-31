import type { ActionTree } from 'vuex'
import type { RootState } from '../types'
import type { DiagnosticsState } from './types'

export const actions = {
  async reset ({ commit }) {
    commit('setReset')
  }
} satisfies ActionTree<DiagnosticsState, RootState>
