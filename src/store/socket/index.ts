/* eslint-disable @typescript-eslint/camelcase */

import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { SocketState } from './types'
import { RootState } from '../types'

export const state: SocketState = {
  open: false,
  error: null,
  waits: [],
  console: [],
  chart: [],
  macros: {},
  temperature_fans: [],
  heater_fans: [],
  temperature_sensors: [],
  printer: {
    heaters: {
      available_heaters: [],
      available_sensors: []
    },
    info: {
      state: 'ready',
      state_message: ''
    },
    configfile: {
      config: {
        extruder: {}
      }
    },
    objects: [],
    idle_timeout: {
      state: 'ready'
    },
    print_stats: {
      state: '',
      print_duration: 0,
      filename: 'standby'
    },
    display_status: {
      progress: 0,
      message: ''
    },
    toolhead: {
      position: [0, 0, 0, 0],
      homed_axes: ''
    },
    current_file: {
      estimated_time: 0,
      thumbnails: [
        { data: null, size: 0, width: 0, height: 0 },
        { data: null, size: 0, width: 0, height: 0 }
      ]
    },
    gcode_move: {
      homing_origin: []
    },
    fan: {
      speed: 0
    }
  }
}

const namespaced = true

export const socket: Module<SocketState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
