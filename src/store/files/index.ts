import type { Module } from 'vuex'
import type { RootState } from '../types'
import { actions } from './actions'
import { getters } from './getters'
import { mutations } from './mutations'
import { createState } from './state'
import type { FilesState } from './types'

export const files = {
  namespaced: true,
  state: createState,
  getters,
  actions,
  mutations
} satisfies Module<FilesState, RootState>
