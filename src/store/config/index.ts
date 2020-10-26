/* eslint-disable @typescript-eslint/camelcase */

import { Module } from 'vuex'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { ConfigState } from './types'
import { RootState } from '../types'
import { Globals } from '@/globals'

export const state: ConfigState = {
  apiUrl: '',
  socketUrl: '',
  unsavedChanges: false,
  localConfig: {
    cameraVisible: false,
    chartVisible: true,
    limitsVisible: false
  },
  fileConfig: {
    general: {
      instanceName: Globals.APP_NAME,
      darkMode: true,
      printTimeEstimationsType: 'file',
      defaultExtrudeLength: 10,
      defaultExtrudeSpeed: 5,
      defaultToolheadMoveLength: '1.0'
    },
    camera: {
      url: '/webcam/?action=stream',
      rotateX: false
    },
    dashboard: {
      hiddenMacros: []
    }
  }
}

const namespaced = true

export const config: Module<ConfigState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
