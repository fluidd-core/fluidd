import type { ConfigState } from './types'
import { Globals } from '@/globals'

export const defaultState = (): ConfigState => {
  return {
    appReady: false,
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
        toolheadCircleXYMoveDistances: [1, 10, 25, 50],
        toolheadCircleZMoveDistances: [0.1, 1, 10, 50],
        toolheadCircleXYHomingEnabled: false,
        useGcodeCoords: false,
        zAdjustDistances: [0.005, 0.01, 0.025, 0.050],
        enableVersionNotifications: true,
        confirmOnEstop: false,
        confirmOnPowerDeviceChange: false,
        confirmOnSaveConfigAndRestart: true,
        sectionsToIgnorePendingConfigurationChanges: [],
        dateFormat: 'iso',
        timeFormat: 'iso',
        enableKeyboardShortcuts: true,
        textSortOrder: 'default',
        filesAndFoldersDragAndDrop: true,
        showRateOfChange: false,
        showRelativeHumidity: true,
        showBarometricPressure: true,
        showGasResistance: true,
        showSaveConfigAndRestart: true,
        showUploadAndPrint: true,
        flipConsoleLayout: false,
        cameraFullscreenAction: 'embed',
        printerPowerDevice: null,
        topNavPowerToggle: null,
        showManualProbeDialogAutomatically: true,
        showBedScrewsAdjustDialogAutomatically: true,
        showScrewsTiltAdjustDialogAutomatically: true,
        forceMoveToggleWarning: true,
        printInProgressLayout: 'default',
        printProgressCalculation: ['file'],
        printEtaCalculation: ['file'],
        enableDiagnostics: false,
        thumbnailSize: 32,
        colorPickerValueRange: 'absolute',
        showHiddenOutputs: false
      },
      theme: {
        isDark: true,
        logo: {
          src: 'logo_fluidd.svg'
        },
        color: '#2196F3',
        backgroundLogo: true
      },
      editor: {
        confirmDirtyEditorClose: true,
        autoEditExtensions: ['.cfg', '.conf', '.ini', '.log', '.sh', '.txt'],
        restoreViewState: 'session',
        codeLens: true,
        klipperSaveAndRestartAction: 'auto'
      },
      dashboard: {
        tempPresets: []
      },
      tableHeaders: {},
      gcodePreview: {
        extrusionLineWidth: 0.3,
        moveLineWidth: 0.1,
        retractionIconSize: 0.6,
        drawOrigin: true,
        drawBackground: true,
        showAnimations: true,
        minLayerHeight: 0.1,
        autoLoadOnPrintStart: false,
        autoLoadMobileOnPrintStart: false,
        autoFollowOnFileLoad: true,
        hideSinglePartBoundingBox: false,
        autoZoom: false,
        flip: {
          horizontal: false,
          vertical: true
        },
        showCurrentLayer: true,
        showNextLayer: false,
        showPreviousLayer: false,
        showMoves: true,
        showExtrusions: true,
        showRetractions: true,
        showParts: true,
        followProgress: false
      },
      fileSystem: {
        activeFilters: {},
        sortBy: {},
        sortDesc: {}
      },
      toolhead: {
        extrudeSpeed: -1,
        extrudeLength: -1
      },
      spoolman: {
        autoSpoolSelectionDialog: true,
        autoOpenQRDetectionCamera: null,
        autoSelectSpoolOnMatch: false,
        preferDeviceCamera: false,
        warnOnNotEnoughFilament: true,
        warnOnFilamentTypeMismatch: true,
        selectionDialogSortOrder: {
          key: 'last_used',
          desc: false
        },
        remainingFilamentUnit: 'weight',
        selectedCardFields: ['vendor', 'filament_name', 'remaining_weight', 'location', 'material', 'lot_nr', 'first_used', 'comment']
      },
      history: {
        timeInDays: false,
        lengthInKilometers: false
      }
    }
  }
}

export const state = defaultState()
