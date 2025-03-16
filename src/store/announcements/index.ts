import type { Module } from 'vuex'
import { state } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import type { AnnouncementsState } from './types'
import type { RootState } from '../types'

const namespaced = true

export const announcements = {
  namespaced,
  state,
  getters,
  actions,
  mutations
} satisfies Module<AnnouncementsState, RootState>
