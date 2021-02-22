import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { SocketState } from './types'
import { RootState } from '../types'

export const defaultState = (): SocketState => {
  return {
    open: false, // socket is open or closed.
    connecting: true, // socket is trying to connect.
    ready: false, // indicates the socket is ready (and has first dump of data...)
    acceptingNotifications: false,
    consoleEntryCount: 0,
    error: null,
    endstops: {},
    console: [],
    availableCommands: {},
    chart: [],
    macros: [],
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
      serverInfo: {
        failed_plugins: [],
        klippy_connected: false, // indicates if klippy is disconnected vs shutdown.
        klippy_state: '',
        plugins: [],
        registered_directories: []
      },
      configfile: {
        save_config_pending: false,
        config: {},
        settings: {
          bed_mesh: {},
          fan: {},
          printer: {
            max_accel_to_decel: 0,
            max_accel: 0,
            max_velocity: 0,
            square_corner_velocity: 5,
            kinematics: 'none'
          },
          virtual_sdcard: {},
          pause_resume: {},
          display_status: {},
          'gcode_macro CANCEL_PRINT': {},
          extruder: {
            max_extrude_only_velocity: 100,
            max_extrude_only_distance: 100
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
        total_duration: 0,
        filament_used: 0,
        filename: ''
      },
      display_status: {
        progress: 0,
        message: ''
      },
      virtual_sdcard: {
        file_position: 0,
        is_active: false,
        progress: 0
      },
      toolhead: {
        estimated_print_time: 0,
        homed_axes: '',
        max_accel: 0,
        max_accel_to_decel: 0,
        max_velocity: 0,
        position: [0, 0, 0, 0],
        print_time: 0,
        square_corner_velocity: 0,
        extruder: ''
      },
      current_file: {
        estimated_time: 0,
        filament_total: 0,
        thumbnails: [
          { data: null, size: 0, width: 0, height: 0 },
          { data: null, size: 0, width: 0, height: 0 }
        ]
      },
      gcode_move: {
        gcode_position: [0, 0, 0, 0],
        homing_origin: [],
        speed: 0
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

export const state = defaultState()

const namespaced = true

export const socket: Module<SocketState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
