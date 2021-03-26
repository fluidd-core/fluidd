import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { FilesState } from './types'
import { RootState } from '../types'

export const defaultState = (): FilesState => {
  return {
    availableRoots: [],
    gcodes: [],
    config: [],
    config_examples: [],
    docs: [],
    uploads: [],
    currentPaths: {},
    disk_usage: {
      total: 0,
      used: 0,
      free: 0
    }
  }
}

export const state = defaultState()

const namespaced = true

export const files: Module<FilesState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
