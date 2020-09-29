/* eslint-disable @typescript-eslint/camelcase */

import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { FilesState } from './types'
import { RootState } from '../types'

export const state: FilesState = {
  gcodes: [],
  config: [],
  configExamples: []
}

const namespaced = true

export const files: Module<FilesState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
