/* eslint-disable @typescript-eslint/camelcase */

import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { SocketState } from './types'
import { RootState } from '../types'

export const getDefaultState = (): SocketState => {
  return {
    open: false,
    error: null,
    waits: [],
    endstops: {},
    console: [],
    chart: [],
    macros: {},
    temperature_fans: [],
    heater_fans: [],
    temperature_sensors: [],
    temperature_probes: [],
    filament_switch_sensors: [],
    output_pins: [],
    printer: {
      bed_mesh: {},
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
          extruder: {},
          bed_mesh: {}
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
}

export const state: SocketState = getDefaultState()

const namespaced = true

export const socket: Module<SocketState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
