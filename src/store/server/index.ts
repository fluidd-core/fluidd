import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { ServerState } from './types'
import { RootState } from '../types'

export const defaultState = (): ServerState => {
  return {
    klippy_retries: 0, // how many times have we attempted to reconnect to klippy.
    info: {
      failed_components: [],
      klippy_connected: false, // indicates if klippy is disconnected vs shutdown.
      klippy_state: '',
      components: [],
      registered_directories: []
    },
    config: {
      authorization: {
        enabled: true
      },
      server: {
        gcode_store_size: 1000,
        temperature_store_size: 1200
      }
    },
    moonraker_stats: [],
    throttled_state: {
      bits: 0,
      flags: []
    },
    cpu_temp: null
  }
}

export const state = defaultState()

const namespaced = true

export const server: Module<ServerState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
