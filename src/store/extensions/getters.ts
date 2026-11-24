import type { GetterTree } from 'vuex'
import type { RootState } from '../types'
import type { ExtensionsState } from './types'

export const getters = {
  getAgents: state => {
    return state.agents
  }
} satisfies GetterTree<ExtensionsState, RootState>
