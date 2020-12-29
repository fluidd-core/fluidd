import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { WaitState } from './types'
import { RootState } from '../types'

export const defaultState = (): WaitState => {
  return {
    waits: []
  }
}

export const state = defaultState()

const namespaced = true

export const wait: Module<WaitState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
