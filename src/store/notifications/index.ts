import { Module } from 'vuex'
import { state } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { NotificationsState } from './types'
import { RootState } from '../types'

const namespaced = true

export const notifications: Module<NotificationsState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
