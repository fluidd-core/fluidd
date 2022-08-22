import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { WebcamsState } from './types'
import { RootState } from '../types'

export const defaultState = (): WebcamsState => {
  return {
    webcams: []
  }
}

export const state = defaultState()

const namespaced = true

export const webcams: Module<WebcamsState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
