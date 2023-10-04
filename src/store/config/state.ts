import { ConfigState } from './types'
import { Globals } from '@/globals'

export const defaultState = (): ConfigState => {
  return {
    apiUrl: '',
    socketUrl: '',
    layoutMode: false,
    containerColumnCount: 2,
    hostConfig: {
      endpoints: [],
      blacklist: [],
      hosted: false,
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
        toolheadControlStyle: 'cross',
        toolheadMoveDistances: [0.1, 1, 10, 25, 50, 100],
        toolheadXYMoveDistances: [1, 10, 50],
        toolheadZMoveDistances: [0.1, 1, 10],
        useGcodeCoords: false,
        zAdjustDistances: [0.005, 0.01, 0.025, 0.050],
        enableVersionNotifications: true,
        confirmOnEstop: false,
        confirmOnPowerDeviceChange: false,
        confirmOnSaveConfigAndRestart: true,
        ignoreDefaultBedMeshPendingConfigurationChanges: false,
        dateFormat: 'iso',
        timeFormat: 'iso',
        textSortOrder: 'default',
        showRateOfChange: false,
        showRelativeHumidity: true,
        showBarometricPressure: true,
        showGasResistance: true,
        showSaveConfigAndRestart: true,
        showUploadAndPrint: true,
        flipConsoleLayout: false,
        cameraFullscreenAction: 'embed',
        topNavPowerToggle: null,
        showManualProbeDialogAutomatically: true,
        showBedScrewsAdjustDialogAutomatically: true,
        forceMoveToggleWarning: true,
        enableDiagnostics: false,
        thumbnailSize: 32
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
        restoreViewState: 'session',
        codeLens: true
      },
      dashboard: {
        tempPresets: []
      },
      tableHeaders: {
        gcodes_dashboard: [
          { value: 'first_layer_extr_temp', visible: false },
          { value: 'first_layer_bed_temp', visible: false },
          { value: 'chamber_temp', visible: false },
          { value: 'history.total_duration', visible: false },
          { value: 'history.print_duration', visible: false },
          { value: 'estimated_time', visible: false },
          { value: 'nozzle_diameter', visible: false },
          { value: 'slicer_version', visible: false },
          { value: 'slicer', visible: false },
          { value: 'history.filament_used', visible: false },
          { value: 'filament_name', visible: false },
          { value: 'filament_type', visible: false },
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
          { value: 'chamber_temp', visible: false },
          { value: 'first_layer_extr_temp', visible: false },
          { value: 'first_layer_bed_temp', visible: false }
        ],
        history: [
          { value: 'print_duration', visible: false },
          { value: 'filament_used', visible: false }
        ],
        job_queue: [
          { value: 'time_added', visible: true },
          { value: 'time_in_queue', visible: false }
        ]
      },
      gcodePreview: {
        extrusionLineWidth: 0.3,
        moveLineWidth: 0.1,
        retractionIconSize: 0.6,
        drawBackground: true,
        showAnimations: true,
        minLayerHeight: 0.1,
        autoLoadOnPrintStart: false,
        autoLoadMobileOnPrintStart: false,
        autoFollowOnFileLoad: true,
        autoZoom: false,
        flip: {
          horizontal: false,
          vertical: true
        }
      },
      fileSystem: {
        activeFilters: {}
      },
      toolhead: {
        forceMove: false,
        extrudeSpeed: -1,
        extrudeLength: -1
      },
      spoolman: {
        autoSpoolSelectionDialog: true,
        autoOpenQRDetectionCamera: null,
        autoSelectSpoolOnMatch: false,
        preferDeviceCamera: false,
        warnOnNotEnoughFilament: true,
        warnOnFilamentTypeMismatch: true
      }
    }
  }
}

export const state = defaultState()
