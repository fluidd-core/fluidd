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
        { name: 'Čeština', code: 'cz' },
        { name: '简体中文', code: 'cn' },
        { name: '繁體中文', code: 'zh-HK' },
        { name: 'Deutsch', code: 'de' },
        { name: 'Español', code: 'es' },
        { name: 'Français', code: 'fr' },
        { name: 'Italiano', code: 'it' },
        { name: 'Magyar', code: 'hu' },
        { name: 'Nederlands', code: 'nl' },
        { name: 'Português', code: 'pt' },
        { name: 'Русский', code: 'ru' },
        { name: 'Українська', code: 'uk' },
        { name: '한국어', code: 'ko' },
        { name: 'العربية', code: 'ar' },
        { name: '日本語', code: 'ja' }
      ],
      themePresets: []
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
        defaultExtrudeLength: 10,
        defaultExtrudeSpeed: 5,
        defaultToolheadMoveLength: 1.0,
        defaultToolheadXYSpeed: 130,
        defaultToolheadZSpeed: 10,
        toolheadMoveDistances: [0.1, 1, 10, 25, 50, 100],
        useGcodeCoords: false,
        zAdjustDistances: [0.005, 0.01, 0.025, 0.050],
        enableVersionNotifications: true,
        confirmOnEstop: false,
        confirmOnPowerDeviceChange: false,
        confirmOnSaveConfigAndRestart: true,
        dateformat: 'MMM. DD,',
        timeformat: 'hh:mm a',
        showRateOfChange: false,
        showRelativeHumidity: true,
        showBarometricPressure: true,
        showSaveConfigAndRestart: true,
        flipConsoleLayout: false,
        cameraFullscreenAction: 'embed',
        topNavPowerToggle: null,
        forceMoveToggleWarning: true,
        enableDiagnostics: false
      },
      theme: {
        isDark: true,
        logo: {
          src: '/logo_fluidd.svg',
          dynamic: true
        },
        currentTheme: {
          primary: '#2196F3'
        }
      },
      editor: {
        confirmDirtyEditorClose: true,
        autoEditExtensions: ['.cfg', '.conf', '.ini', '.log', '.md', '.sh', '.txt'],
        codeLens: true
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
          { value: 'filament_weight_total', visible: false },
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
          { value: 'print_duration', visible: false },
          { value: 'filament_used', visible: false }
        ]
      },
      gcodePreview: {
        extrusionLineWidth: 0.3,
        moveLineWidth: 0.1,
        retractionIconSize: 0.6,
        drawBackground: true,
        showAnimations: true,
        groupLowerLayers: false,
        autoLoadOnPrintStart: false,
        autoFollowOnFileLoad: true,
        flip: {
          horizontal: false,
          vertical: true
        }
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
