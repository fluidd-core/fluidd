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
    cardState: {},
    cardLayout: {
      dashboard1: [
        { name: 'toolhead-card', enabled: true },
        { name: 'camera-card', enabled: true },
        { name: 'printer-limits-card', enabled: true }
      ],
      dashboard2: [
        { name: 'tools-card', enabled: true },
        { name: 'macros-card', enabled: true },
        { name: 'console-card', enabled: true },
        { name: 'temperature-graph-card', enabled: true }
      ]
    },
    instances: [],
    fileConfig: {
      general: {
        instanceName: Globals.APP_NAME,
        jobsInDash: false,
        darkMode: true,
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
