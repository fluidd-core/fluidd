import type { Module } from 'vuex'
import type { RootState } from '../types'
import { actions } from './actions'
import { getters } from './getters'
import { mutations } from './mutations'
import { createState } from './state'
import type { AnnouncementsState } from './types'

export const announcements = {
  namespaced: true,
  state: createState,
  getters,
  actions,
  mutations
} satisfies Module<AnnouncementsState, RootState>
