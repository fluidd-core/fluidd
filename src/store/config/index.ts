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
    localConfig: {},
    instances: [],
    fileConfig: {
      general: {
        instanceName: Globals.APP_NAME,
        jobsInMenu: true,
        jobsInDash: false,
        darkMode: true,
        axis: {
          x: { inverted: false },
          y: { inverted: false },
          z: { inverted: false }
        },
        invertZControl: false,
        printTimeEstimationsType: 'file',
        defaultExtrudeLength: 10,
        defaultExtrudeSpeed: 5,
        defaultToolheadMoveLength: '1.0'
      },
      camera: {
        enabled: false,
        type: 'mjpgstreamer',
        url: '/webcam/?action=stream',
        flipX: false,
        flipY: false
      },
      dashboard: {
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
