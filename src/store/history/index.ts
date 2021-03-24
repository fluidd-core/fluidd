import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { HistoryState } from './types'
import { RootState } from '../types'

/**
 * Maintains the state of the console
 */
export const defaultState = (): HistoryState => {
  return {
    count: 0,
    jobs: [],
    job_totals: {
      total_jobs: 0,
      total_time: 0,
      total_print_time: 0,
      total_filament_used: 0,
      longest_job: 0,
      longest_print: 0
    }
  }
}

export const state = defaultState()

const namespaced = true

export const history: Module<HistoryState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
