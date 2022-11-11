import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { TimelapseState, TimelapseWritableSettings } from './types'
import { RootState } from '../types'

export const defaultWritableSettings = (): TimelapseWritableSettings => {
  return {
    enabled: true,
    mode: 'layermacro',
    camera: '',
    stream_delay_compensation: 0.05,
    gcode_verbose: false,
    parkhead: false,
    parkpos: 'back_left',
    park_custom_pos_x: 10.0,
    park_custom_pos_y: 10.0,
    park_custom_pos_dz: 0.0,
    park_travel_speed: 100,
    park_retract_speed: 15,
    park_extrude_speed: 15,
    park_retract_distance: 1.0,
    park_extrude_distance: 1.0,
    park_time: 0.1,
    fw_retract: false,
    hyperlapse_cycle: 30,
    autorender: false,
    constant_rate_factor: 23,
    output_framerate: 30,
    pixelformat: 'yuv420p',
    time_format_code: '%Y%m%d_%H%M',
    extraoutputparams: '',
    variable_fps: false,
    targetlength: 10,
    variable_fps_min: 5,
    variable_fps_max: 60,
    duplicatelastframe: 5,
    previewimage: true, // true for better timelapse browser integration
    saveframes: false
  }
}

export const defaultState = (): TimelapseState => {
  return {
    lastFrame: undefined,
    settings: {
      ...defaultWritableSettings(),
      snapshoturl: 'http://localhost:8080/?action=snapshot',
      rotation: 0,
      flip_x: false,
      flip_y: false,
      blockedsettings: []
    },
    renderStatus: undefined
  }
}

export const state = defaultState()

const namespaced = true

export const timelapse: Module<TimelapseState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
