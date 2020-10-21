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
    connecting: false,
    acceptingNotifications: false,
    error: null,
    waits: [],
    endstops: {},
    console: [],
    chart: [],
    macros: {},
    plugins: [],
    temperature_fans: [],
    heater_fans: [],
    heater_generics: [],
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
        state: '',
        state_message: ''
      },
      configfile: {
        config: {
          extruder: {},
          bed_mesh: {},
          fan: {},
          printer: {
            max_accel_to_decel: 0,
            max_accel: 0,
            max_velocity: 0,
            square_corner_velocity: 5
          }
        }
      },
      objects: [],
      idle_timeout: {
        state: ''
      },
      print_stats: {
        state: '',
        print_duration: 0,
        filename: ''
      },
      display_status: {
        progress: 0,
        message: ''
      },
      toolhead: {
        estimated_print_time: 0,
        homed_axes: '',
        max_accel: 0,
        max_accel_to_decel: 0,
        max_velocity: 0,
        position: [0, 0, 0, 0],
        print_time: 0,
        square_corner_velocity: 0
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
      },
      webhooks: {
        state: 'ready',
        state_message: ''
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
