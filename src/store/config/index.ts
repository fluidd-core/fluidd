import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { ConfigState } from './types'
import { RootState } from '../types'
import { Globals } from '@/globals'

export const defaultState = (): ConfigState => {
  return {
    apiUrl: '',
    socketUrl: '',
    layoutMode: false,
    hostConfig: {
      endpoints: [],
      blacklist: [],
      hosted: false,
      locales: [
        { name: 'English', code: 'en' },
        { name: 'Chinese', code: 'cn' },
        { name: 'Deutsch', code: 'de' },
        { name: 'Français', code: 'fr' },
        { name: 'Magyar', code: 'hu' },
        { name: 'Nederlands', code: 'nl' },
        { name: 'Portuguese', code: 'pt' },
        { name: 'Русский', code: 'ru' },
        { name: '한국어', code: 'ko' }
      ]
    },
    instances: [],
    uiSettings: {
      general: {
        instanceName: Globals.APP_NAME,
        locale: 'en',
        chartVisible: true,
        hideTempWaits: true,
        axis: {
          x: { inverted: false },
          y: { inverted: false },
          z: { inverted: false }
        },
        printTimeEstimationsType: 'file',
        defaultExtrudeLength: 10,
        defaultExtrudeSpeed: 5,
        defaultToolheadMoveLength: 1.0,
        defaultToolheadXYSpeed: 130,
        defaultToolheadZSpeed: 10,
        useGcodeCoords: false,
        zAdjustDistances: [0.005, 0.01, 0.025, 0.050],
        enableNotifications: true
      },
      theme: {
        isDark: true,
        currentTheme: {
          primary: '#2196F3'
        }
      },
      dashboard: {
        tempPresets: []
      },
      tableHeaders: {
        gcodes_dashboard: [
          { value: 'first_layer_extr_temp', visible: false },
          { value: 'first_layer_bed_temp', visible: false },
          { value: 'history.total_duration', visible: false },
          { value: 'history.print_duration', visible: false },
          { value: 'estimated_time', visible: false },
          { value: 'slicer_version', visible: false },
          { value: 'slicer', visible: false },
          { value: 'history.filament_used', visible: false },
          { value: 'filament_total', visible: false },
          { value: 'object_height', visible: false },
          { value: 'first_layer_height', visible: false },
          { value: 'layer_height', visible: false }
        ],
        gcodes_jobs: [
          { value: 'first_layer_height', visible: false },
          { value: 'history.filament_used', visible: false },
          { value: 'slicer_version', visible: false },
          { value: 'history.print_duration', visible: false },
          { value: 'first_layer_extr_temp', visible: false },
          { value: 'first_layer_bed_temp', visible: false }
        ],
        history: [
          { value: 'end_time', visible: false },
          { value: 'print_duration', visible: false },
          { value: 'filament_used', visible: false }
        ]
      }
    }
  }
}

export const state = defaultState()

const namespaced = true

export const config: Module<ConfigState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
