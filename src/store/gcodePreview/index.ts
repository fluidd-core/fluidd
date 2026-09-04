import type { Module } from 'vuex'
import { createState } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import type { GcodePreviewState } from './types'
import type { RootState } from '../types'

export const gcodePreview = {
  namespaced: true,
  state: createState,
  getters,
  actions,
  mutations
} satisfies Module<GcodePreviewState, RootState>
