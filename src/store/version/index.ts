import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { VersionState } from './types'
import { RootState } from '../types'

export const defaultState = (): VersionState => {
  return {
    busy: false,
    skipClientUpdates: false,
    responses: [],
    components: {},
    fluidd: {
      version: '',
      hash: ''
    }
  }
}

export const state = defaultState()

const namespaced = true

export const version: Module<VersionState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
