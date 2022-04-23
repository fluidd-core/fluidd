import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { AnnouncementsState } from './types'
import { RootState } from '../types'
import { Module } from 'vuex'

export const defaultState = (): AnnouncementsState => {
  return {
    entries: [],
    feeds: []
  }
}

export const state = defaultState()

const namespaced = true

export const announcements: Module<AnnouncementsState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
