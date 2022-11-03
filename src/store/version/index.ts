import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { VersionState } from './types'
import { RootState } from '../types'

export const defaultState = (): VersionState => {
  return {
    busy: false, // busy doing an update.
    github_limit_reset_time: 0,
    github_rate_limit: 0,
    github_requests_remaining: 0,
    responses: [],
    version_info: {},
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
