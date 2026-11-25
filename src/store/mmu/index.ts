import type { Module } from 'vuex'
import type { RootState } from '../types'
import { actions } from './actions'
import { getters } from './getters'
import { mutations } from './mutations'
import { createState } from './state'
import type { MmuState } from './types'

export const mmu = {
  namespaced: true,
  state: createState,
  getters,
  actions,
  mutations
} satisfies Module<MmuState, RootState>
