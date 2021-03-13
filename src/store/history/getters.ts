import Vue from 'vue'
import { GetterTree } from 'vuex'
import { HistoryState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<HistoryState, RootState> = {
  /**
   * Returns a list of history entries, sorted by their start dates and
   * optionally limited by a provided number.
   */
  getHistory: (state, getters, rootState) => (limit?: number) => {
    // const sdcard_file = rootState.printer?.printer.print_stats.filename || ''
    let prints = Object.keys(state.prints)
      .reverse()
    if (limit) prints = prints.slice(0, limit)
    return prints
      .map(key => {
        const id = +key
        return { id, ...state.prints[id] }
      })
  }
}
