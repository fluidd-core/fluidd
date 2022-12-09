import { Module } from 'vuex'
import { state } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { PrinterState } from './types'
import { RootState } from '../types'

const namespaced = true

export const printer: Module<PrinterState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
