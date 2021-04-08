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
        zAdjustDistances: [0.001, 0.005, 0.010, 0.050],
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

    © 2021 GitHub, Inc.
    Terms
    Privacy
    Security
    Status
    Docs

    Contact GitHub
    Pricing
    API
    Training
    Blog
    About

