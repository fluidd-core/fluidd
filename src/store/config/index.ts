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
    unsavedChanges: false,
    layoutMode: false,
    appState: {
      chartSelectedLegends: {}
    },
    cardState: {},
    cardLayout: {
      dashboard1: [
        { name: 'toolhead-card', enabled: true },
        { name: 'outputs-card', enabled: true },
        { name: 'macros-card', enabled: true },
        { name: 'printer-limits-card', enabled: true },
        { name: 'camera-card', enabled: true }
      ],
      dashboard2: [
        { name: 'temperature-card', enabled: true },
        { name: 'jobs-card', enabled: true },
        { name: 'console-card', enabled: true }
      ]
    },
    instances: [],
    // saves to file .fluidd
    uiSettings: {
      general: {
        instanceName: Globals.APP_NAME,
        chartVisible: true,
        hideTempWaits: true,
        axis: {
          x: { inverted: false },
          y: { inverted: false },
          z: { inverted: false }
        },
        invertZControl: false,
        printTimeEstimationsType: 'file',
        defaultExtrudeLength: 10,
        defaultExtrudeSpeed: 5,
        defaultToolheadMoveLength: '1.0',
        defaultToolheadXYSpeed: 130,
        defaultToolheadZSpeed: 10
      },
      theme: {
        isDark: true,
        currentTheme: {
          primary: '#2196F3'
        }
      },
      camera: {
        enabled: false,
        type: 'mjpgstreamer',
        url: '/webcam/?action=stream',
        flipX: false,
        flipY: false
      },
      dashboard: {
        tempPresets: [],
        hiddenMacros: []
      }
    },
    // saves to file .fluidd_history
    consoleHistory: [],
    hostConfig: {
      endpoints: [],
      blacklist: [],
      hosted: false
    },
    serverConfig: {
      authorization: {},
      server: {
        gcode_store_size: 1000,
        temperature_store_size: 1200
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
