import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { TimelapseState } from './types'
import { RootState } from '../types'

export const defaultState = (): TimelapseState => {
  return {
    lastFrame: undefined,
    settings: undefined,
    renderStatus: undefined
  }
}

export const state = defaultState()

const namespaced = true

export const timelapse: Module<TimelapseState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
