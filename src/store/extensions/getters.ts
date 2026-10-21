import type { GetterTree } from 'vuex'
import type { ExtensionsState } from './types'
import type { RootState } from '../types'

export const getters = {
  getAgents: (state) => {
    return state.agents
  }
} satisfies GetterTree<ExtensionsState, RootState>
